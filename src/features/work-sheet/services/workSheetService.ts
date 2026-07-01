import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  runTransaction,
} from "firebase/firestore";
import type {
  PaymentType,
  WorkItem,
  WorkItemClient,
  WorkItemClientDraft,
  WorkItemDraft,
  WorkItemPayment,
  WorkItemStatus,
  WorkParticipant,
} from "../types";
import {
  buildWorkFinancialSummary,
  buildWorkParticipant,
  normalizeParticipantDrafts,
  roundMoney,
} from "../utils/work-calculations";

const workItemsCollection = collection(db, "workItems");

const paymentsCollection = (workItemId: string) =>
  collection(db, "workItems", workItemId, "payments");

const toMoney = roundMoney;

const stripUndefined = <T>(value: T): T => {
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefined(item)) as T;
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, entry]) => entry !== undefined)
        .map(([key, entry]) => [key, stripUndefined(entry)])
    ) as T;
  }

  return value;
};

const normalizeStatus = (
  status: WorkItemStatus,
  paidAmount: number,
  totalAmount: number
): WorkItemStatus => {
  if (status === "cancelled") return status;
  if (paidAmount <= 0) return "open";
  if (paidAmount >= totalAmount) return "paid";
  return "partially_paid";
};

const cloneClients = (clients: WorkItemClient[] = []): WorkItemClient[] =>
  clients.map((client) => ({ ...client }));

const resolveParticipantDrafts = (
  draftParticipants: WorkItemClientDraft[] = [],
  totalPrice = 0
): WorkItemClientDraft[] => normalizeParticipantDrafts(draftParticipants, totalPrice);

const resolveParticipants = (
  draftParticipants: WorkItemClientDraft[] = [],
  summary: Pick<ReturnType<typeof buildWorkFinancialSummary>, "jobPrice" | "depositAmount">,
  existingParticipants: WorkItemClient[] = []
): WorkItemClient[] => {
  const normalizedDrafts = resolveParticipantDrafts(draftParticipants, summary.jobPrice);

  return normalizedDrafts.map((participant, index) =>
    buildWorkParticipant(
      participant,
      summary,
      existingParticipants[index],
      existingParticipants[index]?.paidAmount ?? 0
    )
  );
};

const normalizeWorkItem = (raw: unknown): WorkItem => {
  const data = raw as Partial<WorkItem> & {
    ownerName?: string;
    clients?: Array<Partial<WorkItemClient>>;
    participants?: Array<Partial<WorkParticipant>>;
  };
  const rawParticipants: Array<Partial<WorkParticipant>> =
    data.participants && data.participants.length > 0
      ? data.participants
      : data.clients && data.clients.length > 0
        ? data.clients
        : data.ownerName
          ? [
              {
                id: "participant-1",
                name: data.ownerName,
                amount: data.jobPrice ?? 0,
                shareAmount: data.jobPrice ?? 0,
                paidAmount: data.paidAmount ?? 0,
                remainingAmount: data.remainingAmount ?? 0,
              },
            ]
          : [];

  const summary = buildWorkFinancialSummary({
    jobPrice: data.jobPrice ?? 0,
    depositType: data.depositType,
    depositRate: data.depositRate,
    depositValue: data.depositValue,
    revisionCount: data.revisionCount ?? 0,
    revisionFee: data.revisionFee ?? 0,
    paidAmount: data.paidAmount ?? 0,
    status: data.status,
  });

  const participants = resolveParticipants(
    rawParticipants.map((participant) => ({
      id: participant.id,
      name: participant.name || "",
      amount: participant.amount ?? participant.shareAmount ?? 0,
      shareAmount: participant.shareAmount ?? participant.amount ?? 0,
      depositType: participant.depositType ?? data.depositType ?? "percentage",
      depositValue: participant.depositValue ?? data.depositValue ?? data.depositRate ?? 0,
    })),
    { jobPrice: summary.jobPrice, depositAmount: summary.depositAmount },
    rawParticipants.map((participant) => ({
      id: participant.id || "",
      name: participant.name || "",
      amount: toMoney(participant.amount ?? participant.shareAmount ?? 0),
      shareAmount: toMoney(participant.shareAmount ?? participant.amount ?? 0),
      depositType: participant.depositType ?? "percentage",
      depositValue: toMoney(participant.depositValue ?? data.depositValue ?? data.depositRate ?? 0),
      depositAmount: toMoney(participant.depositAmount ?? 0),
      paidAmount: toMoney(participant.paidAmount ?? 0),
      remainingAmount: toMoney(participant.remainingAmount ?? 0),
      financialStatus: (participant.financialStatus as WorkParticipant["financialStatus"]) || "unpaid",
    }))
  );

  const totalPaidAmount = toMoney(participants.reduce((sum, participant) => sum + participant.paidAmount, 0));
  const remainingAmount = toMoney(summary.totalAmount - totalPaidAmount);
  const financialStatus = buildWorkFinancialSummary({
    jobPrice: summary.jobPrice,
    depositType: data.depositType,
    depositRate: data.depositRate,
    depositValue: data.depositValue,
    revisionCount: data.revisionCount ?? 0,
    revisionFee: data.revisionFee ?? 0,
    paidAmount: totalPaidAmount,
    status: data.status,
  }).financialStatus;
  const workTitle = (data.workTitle || data.title || "").trim();

  return {
    id: data.id || "",
    workDate: data.workDate || "",
    title: workTitle,
    workTitle,
    clients: participants,
    participants,
    participantCount: participants.length,
    workDetail: data.workDetail?.trim() || undefined,
    workLink: data.workLink?.trim() || undefined,
    jobPrice: summary.jobPrice,
    depositType: data.depositType || "percentage",
    depositValue: toMoney(data.depositValue ?? data.depositRate ?? 0),
    depositRate: toMoney(data.depositRate ?? data.depositValue ?? 0),
    depositAmount: summary.depositAmount,
    remainingAfterDeposit: summary.remainingAfterDeposit,
    revisionCount: Math.max(0, Math.floor(data.revisionCount ?? 0)),
    revisionFee: toMoney(data.revisionFee ?? 0),
    revisionTotal: summary.revisionTotal,
    totalAmount: summary.totalAmount,
    paidAmount: totalPaidAmount,
    remainingAmount,
    financialStatus,
    note: data.note || undefined,
    attachmentUrl: data.attachmentUrl || undefined,
    status: data.status || "open",
    createdByUid: data.createdByUid || "",
    createdByName: data.createdByName || "",
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString(),
  };
};

const buildWorkItemPayload = (
  id: string,
  draft: WorkItemDraft,
  existingItem: WorkItem | null,
  now: string,
  creator?: { uid: string; name: string }
): WorkItem => {
  const jobPrice = Math.max(0, Number(draft.jobPrice) || 0);
  const depositType = draft.depositType || (draft.depositValue != null ? "fixed" : "percentage");
  const depositRate = Math.max(0, Number(draft.depositRate ?? draft.depositValue) || 0);
  const depositValue = Math.max(0, Number(draft.depositValue ?? draft.depositRate) || 0);
  const revisionCount = Math.max(0, Math.floor(Number(draft.revisionCount) || 0));
  const revisionFee = Math.max(0, Number(draft.revisionFee) || 0);
  const summary = buildWorkFinancialSummary({
    jobPrice,
    depositType,
    depositRate,
    depositValue,
    revisionCount,
    revisionFee,
    paidAmount: existingItem?.paidAmount ?? 0,
    status: draft.status,
  });
  const participantsInput = normalizeParticipantDrafts(
    draft.participants && draft.participants.length > 0 ? draft.participants : draft.clients,
    jobPrice
  );
  const participants = participantsInput.map((participant, index) =>
    buildWorkParticipant(
      participant,
      { jobPrice: summary.jobPrice, depositAmount: summary.depositAmount },
      existingItem?.participants?.[index],
      existingItem?.participants?.[index]?.paidAmount ?? 0
    )
  );
  const paidAmount = toMoney(participants.reduce((sum, participant) => sum + participant.paidAmount, 0));
  const status = normalizeStatus(draft.status, paidAmount, summary.totalAmount);
  const workTitle = draft.workTitle.trim();

  return {
    id,
    workDate: draft.workDate,
    title: workTitle,
    workTitle,
    workDetail: draft.workDetail?.trim() || undefined,
    workLink: draft.workLink?.trim() || undefined,
    clients: participants,
    participants,
    participantCount: participants.length,
    jobPrice,
    depositType,
    depositValue,
    depositRate,
    depositAmount: summary.depositAmount,
    remainingAfterDeposit: summary.remainingAfterDeposit,
    revisionCount,
    revisionFee,
    revisionTotal: summary.revisionTotal,
    totalAmount: summary.totalAmount,
    paidAmount,
    remainingAmount: toMoney(summary.totalAmount - paidAmount),
    financialStatus: summary.financialStatus,
    note: draft.note?.trim() || undefined,
    attachmentUrl: draft.attachmentUrl?.trim() || undefined,
    status,
    createdByUid: existingItem?.createdByUid ?? creator?.uid ?? "",
    createdByName: existingItem?.createdByName ?? creator?.name ?? "",
    createdAt: existingItem?.createdAt ?? now,
    updatedAt: now,
  };
};

export const getWorkItems = async (): Promise<WorkItem[]> => {
  const q = query(workItemsCollection, orderBy("updatedAt", "desc"));
  const querySnapshot = await getDocs(q);
  const items: WorkItem[] = [];

  querySnapshot.forEach((docSnap) => {
    items.push(normalizeWorkItem(docSnap.data()));
  });

  return items;
};

export const getWorkItemPayments = async (workItemId: string): Promise<WorkItemPayment[]> => {
  if (!workItemId) return [];

  const q = query(paymentsCollection(workItemId), orderBy("paymentDate", "desc"));
  const querySnapshot = await getDocs(q);
  const payments: WorkItemPayment[] = [];

  querySnapshot.forEach((docSnap) => {
    payments.push(docSnap.data() as WorkItemPayment);
  });

  return payments;
};

export const saveWorkItem = async (
  workItemId: string,
  draft: WorkItemDraft,
  creator?: { uid: string; name: string }
): Promise<void> => {
  if (!workItemId) return;

  const itemRef = doc(db, "workItems", workItemId);
  const existingDoc = await getDoc(itemRef);
  const existingItem = existingDoc.exists() ? normalizeWorkItem(existingDoc.data()) : null;
  const now = new Date().toISOString();
  const payload = stripUndefined(buildWorkItemPayload(workItemId, draft, existingItem, now, creator));

  await setDoc(itemRef, payload);
};

export const deleteWorkItem = async (workItemId: string): Promise<void> => {
  if (!workItemId) return;

  const itemRef = doc(db, "workItems", workItemId);
  const paymentsSnap = await getDocs(paymentsCollection(workItemId));

  await runTransaction(db, async (transaction) => {
    paymentsSnap.forEach((docSnap) => transaction.delete(docSnap.ref));
    transaction.delete(itemRef);
  });
};

export const addPaymentToWorkItem = async (
  userId: string,
  userName: string,
  workItemId: string,
  clientId: string,
  clientName: string,
  paymentType: PaymentType,
  amount: number,
  paymentDate: string,
  note?: string,
  proofUrl?: string
): Promise<void> => {
  if (!userId || !workItemId || !clientId || amount <= 0) return;

  const itemRef = doc(db, "workItems", workItemId);
  const paymentRef = doc(collection(db, "workItems", workItemId, "payments"));
  const now = new Date().toISOString();

  await runTransaction(db, async (transaction) => {
    const itemDoc = await transaction.get(itemRef);

    if (!itemDoc.exists()) {
      throw new Error("Work item does not exist");
    }

    const item = normalizeWorkItem(itemDoc.data());
    const clients = cloneClients(item.clients);
    const targetIndex = clients.findIndex((client) => client.id === clientId);

    if (targetIndex === -1) {
      throw new Error("Client does not exist on this work item");
    }

    const targetClient = clients[targetIndex];
    const nextPaidAmount = toMoney(targetClient.paidAmount + amount);
    clients[targetIndex] = {
      ...targetClient,
      paidAmount: nextPaidAmount,
      remainingAmount: toMoney(targetClient.amount - nextPaidAmount),
    };

    const totalClientPaid = toMoney(clients.reduce((sum, client) => sum + client.paidAmount, 0));
    const remainingAmount = toMoney(item.totalAmount - totalClientPaid);
    const status = normalizeStatus(item.status, totalClientPaid, item.totalAmount);

    const payment: WorkItemPayment = {
      id: paymentRef.id,
      workItemId,
      participantId: clientId,
      participantName: clientName,
      clientId,
      clientName,
      amount: toMoney(amount),
      paymentType,
      paymentDate,
      note,
      proofUrl: proofUrl?.trim() || undefined,
      createdByUid: userId,
      createdByName: userName,
      createdAt: now,
    };

    transaction.set(paymentRef, stripUndefined(payment));
    transaction.update(itemRef, {
      clients,
      participants: clients,
      paidAmount: totalClientPaid,
      remainingAmount,
      financialStatus: buildWorkFinancialSummary({
        jobPrice: item.jobPrice,
        depositType: item.depositType,
        depositRate: item.depositRate,
        depositValue: item.depositValue,
        revisionCount: item.revisionCount,
        revisionFee: item.revisionFee,
        paidAmount: totalClientPaid,
        status,
      }).financialStatus,
      status,
      updatedAt: now,
    });
  });
};

export const updateWorkItemStatus = async (
  workItemId: string,
  status: WorkItemStatus
): Promise<void> => {
  if (!workItemId) return;

  const itemRef = doc(db, "workItems", workItemId);
  const itemDoc = await getDoc(itemRef);
  if (!itemDoc.exists()) return;

  const item = normalizeWorkItem(itemDoc.data());
  const nextStatus = normalizeStatus(status, item.paidAmount, item.totalAmount);

  await runTransaction(db, async (transaction) => {
    transaction.update(itemRef, {
      status: nextStatus,
      remainingAmount: toMoney(item.totalAmount - item.paidAmount),
      financialStatus: buildWorkFinancialSummary({
        jobPrice: item.jobPrice,
        depositType: item.depositType,
        depositRate: item.depositRate,
        depositValue: item.depositValue,
        revisionCount: item.revisionCount,
        revisionFee: item.revisionFee,
        paidAmount: item.paidAmount,
        status: nextStatus,
      }).financialStatus,
      updatedAt: new Date().toISOString(),
    });
  });
};

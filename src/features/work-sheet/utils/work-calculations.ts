import type {
  DepositType,
  FinancialStatus,
  PaymentType,
  WorkPayment,
  WorkParticipant,
  WorkParticipantDraft,
  WorkStatus,
} from "../types";

export interface WorkFinancialSummary {
  jobPrice: number;
  depositAmount: number;
  remainingAfterDeposit: number;
  revisionTotal: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  financialStatus: FinancialStatus;
}

export interface WorkSheetPreview {
  jobPrice: number;
  depositAmount: number;
  remainingAfterDeposit: number;
  revisionTotal: number;
  totalAmount: number;
  participantCount: number;
  pricePerParticipant: number;
  depositPerParticipant: number;
  remainingPerParticipant: number;
  financialStatus: FinancialStatus;
  suggestedParticipantAmounts: number[];
}

export interface WorkParticipantPaymentSummary {
  participantId: string;
  participantName: string;
  requiredAmount: number;
  depositPaidAmount: number;
  remainingPaidAmount: number;
  revisionPaidAmount: number;
  manualPaidAmount: number;
  totalPaidAmount: number;
  remainingAmount: number;
  financialStatus: FinancialStatus;
}

export const roundMoney = (value: number) => Math.round((Number(value) || 0) * 100) / 100;

export const splitAmountEvenly = (total: number, count: number): number[] => {
  if (count <= 0) return [];

  const roundedTotal = roundMoney(total);
  const base = Math.floor((roundedTotal / count) * 100) / 100;
  const shares = Array.from({ length: count }, () => base);
  const consumed = roundMoney(base * Math.max(0, count - 1));
  shares[count - 1] = roundMoney(roundedTotal - consumed);
  return shares;
};

export const resolveDepositType = (
  depositType?: DepositType,
  depositRate?: number,
  depositValue?: number
): DepositType => {
  if (depositType) return depositType;
  if (depositValue != null && depositValue > 0 && (!depositRate || depositRate <= 0)) return "fixed";
  return "percentage";
};

export const calculateDepositAmount = (
  baseAmount: number,
  depositType?: DepositType,
  depositRate?: number,
  depositValue?: number
): number => {
  const resolvedDepositType = resolveDepositType(depositType, depositRate, depositValue);

  if (resolvedDepositType === "fixed") {
    return roundMoney(depositValue ?? 0);
  }

  const rate = depositRate ?? depositValue ?? 0;
  return roundMoney((roundMoney(baseAmount) * rate) / 100);
};

export const calculateFinancialStatus = (
  paidAmount: number,
  totalAmount: number,
  status?: WorkStatus
): FinancialStatus => {
  if (status === "cancelled") return "cancelled";
  if (paidAmount <= 0) return "unpaid";
  if (paidAmount >= totalAmount) return paidAmount > totalAmount ? "overpaid" : "paid";
  return "partial";
};

export const getPaymentTypeLabel = (paymentType: PaymentType): string => {
  const labels: Record<PaymentType, string> = {
    deposit: "มัดจำ",
    installment: "ยอดคงเหลือ",
    final: "ค่าแก้เพิ่ม",
    manual: "อื่น ๆ",
  };

  return labels[paymentType];
};

export const buildParticipantPaymentSummary = (
  participant: Pick<WorkParticipant, "id" | "name" | "amount" | "paidAmount" | "remainingAmount" | "financialStatus">,
  payments: WorkPayment[]
): WorkParticipantPaymentSummary => {
  const participantPayments = payments.filter(
    (payment) => payment.participantId === participant.id || payment.clientId === participant.id
  );

  const depositPaidAmount = roundMoney(
    participantPayments
      .filter((payment) => payment.paymentType === "deposit")
      .reduce((sum, payment) => sum + payment.amount, 0)
  );
  const remainingPaidAmount = roundMoney(
    participantPayments
      .filter((payment) => payment.paymentType === "installment")
      .reduce((sum, payment) => sum + payment.amount, 0)
  );
  const revisionPaidAmount = roundMoney(
    participantPayments
      .filter((payment) => payment.paymentType === "final")
      .reduce((sum, payment) => sum + payment.amount, 0)
  );
  const manualPaidAmount = roundMoney(
    participantPayments
      .filter((payment) => payment.paymentType === "manual")
      .reduce((sum, payment) => sum + payment.amount, 0)
  );
  const totalPaidAmount = roundMoney(
    participantPayments.reduce((sum, payment) => sum + payment.amount, 0)
  );
  const remainingAmount = roundMoney(participant.amount - totalPaidAmount);

  return {
    participantId: participant.id,
    participantName: participant.name,
    requiredAmount: roundMoney(participant.amount),
    depositPaidAmount,
    remainingPaidAmount,
    revisionPaidAmount,
    manualPaidAmount,
    totalPaidAmount,
    remainingAmount,
    financialStatus: calculateFinancialStatus(totalPaidAmount, participant.amount),
  };
};

export const buildWorkPaymentHistory = (payments: WorkPayment[]) =>
  [...payments].sort((left, right) => right.paymentDate.localeCompare(left.paymentDate));

export const normalizeParticipantDraft = (
  participant: WorkParticipantDraft,
  fallbackAmount = 0
): WorkParticipantDraft => {
  const amount = roundMoney(participant.amount ?? participant.shareAmount ?? fallbackAmount);
  return {
    id: participant.id,
    name: participant.name.trim(),
    amount,
    shareAmount: amount,
    depositType: participant.depositType,
    depositValue: participant.depositValue != null ? roundMoney(participant.depositValue) : undefined,
  };
};

export const normalizeParticipantDrafts = (
  participants: WorkParticipantDraft[],
  fallbackTotalAmount = 0
): WorkParticipantDraft[] => {
  const normalized = participants
    .map((participant) => normalizeParticipantDraft(participant))
    .filter((participant) => participant.name.length > 0 || participant.amount > 0);

  const totalEnteredAmount = roundMoney(normalized.reduce((sum, participant) => sum + participant.amount, 0));
  if (normalized.length === 0) return [];

  if (totalEnteredAmount > 0) {
    return normalized;
  }

  const evenShares = splitAmountEvenly(fallbackTotalAmount, normalized.length);
  return normalized.map((participant, index) => ({
    ...participant,
    amount: evenShares[index] ?? 0,
    shareAmount: evenShares[index] ?? 0,
  }));
};

export const buildWorkFinancialSummary = ({
  jobPrice,
  depositType,
  depositRate,
  depositValue,
  revisionCount,
  revisionFee,
  paidAmount = 0,
  status,
}: {
  jobPrice: number;
  depositType?: DepositType;
  depositRate?: number;
  depositValue?: number;
  revisionCount: number;
  revisionFee: number;
  paidAmount?: number;
  status?: WorkStatus;
}): WorkFinancialSummary => {
  const normalizedJobPrice = roundMoney(jobPrice);
  const normalizedRevisionTotal = roundMoney((Number(revisionCount) || 0) * (Number(revisionFee) || 0));
  const normalizedDepositAmount = calculateDepositAmount(normalizedJobPrice, depositType, depositRate, depositValue);
  const totalAmount = roundMoney(normalizedJobPrice + normalizedRevisionTotal);
  const totalPaidAmount = roundMoney(paidAmount);
  const remainingAmount = roundMoney(totalAmount - totalPaidAmount);

  return {
    jobPrice: normalizedJobPrice,
    depositAmount: normalizedDepositAmount,
    remainingAfterDeposit: roundMoney(normalizedJobPrice - normalizedDepositAmount),
    revisionTotal: normalizedRevisionTotal,
    totalAmount,
    paidAmount: totalPaidAmount,
    remainingAmount,
    financialStatus: calculateFinancialStatus(totalPaidAmount, totalAmount, status),
  };
};

export const buildWorkSheetPreview = (input: {
  jobPrice: number;
  depositType?: DepositType;
  depositRate?: number;
  depositValue?: number;
  revisionCount: number;
  revisionFee: number;
  participantCount: number;
}): WorkSheetPreview => {
  const summary = buildWorkFinancialSummary(input);
  return {
    jobPrice: summary.jobPrice,
    depositAmount: summary.depositAmount,
    remainingAfterDeposit: summary.remainingAfterDeposit,
    revisionTotal: summary.revisionTotal,
    totalAmount: summary.totalAmount,
    participantCount: input.participantCount,
    pricePerParticipant: input.participantCount > 0 ? roundMoney(summary.jobPrice / input.participantCount) : 0,
    depositPerParticipant: input.participantCount > 0 ? roundMoney(summary.depositAmount / input.participantCount) : 0,
    remainingPerParticipant: input.participantCount > 0 ? roundMoney(summary.totalAmount / input.participantCount) : 0,
    financialStatus: summary.financialStatus,
    suggestedParticipantAmounts: splitAmountEvenly(summary.jobPrice, input.participantCount),
  };
};

export const buildWorkParticipant = (
  participant: WorkParticipantDraft,
  workSummary: Pick<WorkFinancialSummary, "jobPrice" | "depositAmount">,
  existingParticipant?: WorkParticipant,
  paidAmount = 0
): WorkParticipant => {
  const normalized = normalizeParticipantDraft(participant);
  const shareAmount = roundMoney(normalized.shareAmount ?? normalized.amount);
  const depositShare =
    workSummary.jobPrice > 0 ? roundMoney((shareAmount / workSummary.jobPrice) * workSummary.depositAmount) : 0;
  const totalPaidAmount = roundMoney(existingParticipant?.paidAmount ?? paidAmount);
  const remainingAmount = roundMoney(shareAmount - totalPaidAmount);

  return {
    id: existingParticipant?.id ?? normalized.id ?? crypto.randomUUID(),
    name: normalized.name,
    amount: shareAmount,
    shareAmount,
    depositType: normalized.depositType ?? "percentage",
    depositValue: normalized.depositValue ?? 0,
    depositAmount: depositShare,
    paidAmount: totalPaidAmount,
    remainingAmount,
    financialStatus: calculateFinancialStatus(totalPaidAmount, shareAmount),
  };
};

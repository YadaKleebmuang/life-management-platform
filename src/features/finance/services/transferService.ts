import { db } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs, query, orderBy, runTransaction, where } from "firebase/firestore";
import { Transfer, Transaction as AppTransaction, AccountSnapshot, Account } from "../types";
import { stripUndefinedFields } from "../utils/stripUndefinedFields";

export const getTransfers = async (userId: string): Promise<Transfer[]> => {
  if (!userId) return [];
  const q = query(
    collection(db, "users", userId, "transfers"),
    orderBy("transferDate", "desc")
  );
  const querySnapshot = await getDocs(q);
  const transfers: Transfer[] = [];
  querySnapshot.forEach((doc) => {
    transfers.push(doc.data() as Transfer);
  });
  return transfers;
};

export const saveTransfer = async (userId: string, transfer: Transfer): Promise<void> => {
  if (!userId) return;

  await runTransaction(db, async (transaction) => {
    // 1. Fetch source and destination accounts
    const sourceRef = doc(db, "users", userId, "accounts", transfer.fromAccountId);
    const destRef = doc(db, "users", userId, "accounts", transfer.toAccountId);
    
    const [sourceDoc, destDoc] = await Promise.all([
      transaction.get(sourceRef),
      transaction.get(destRef)
    ]);
    
    if (!sourceDoc.exists() || !destDoc.exists()) {
      throw new Error("Source or destination account does not exist!");
    }
    
    const sourceData = sourceDoc.data() as Account;
    const destData = destDoc.data() as Account;

    if (sourceData.currentBalance < transfer.amount) {
      throw new Error("Insufficient balance in source account!");
    }

    const newSourceBalance = sourceData.currentBalance - transfer.amount;
    const newDestBalance = destData.currentBalance + transfer.amount;

    const now = new Date().toISOString();

    // 2. Update Accounts
    transaction.update(sourceRef, { currentBalance: newSourceBalance, updatedAt: now });
    transaction.update(destRef, { currentBalance: newDestBalance, updatedAt: now });

    // 3. Save Transfer
    const transferRef = doc(db, "users", userId, "transfers", transfer.id);
    transaction.set(transferRef, stripUndefinedFields(transfer));

    // 4. Create Transaction Records (One for deduction, one for addition)
    const txSourceId = crypto.randomUUID();
    const txDestId = crypto.randomUUID();
    
    const txSource: AppTransaction = {
      id: txSourceId,
      userId,
      type: "transfer",
      accountId: transfer.fromAccountId,
      relatedAccountId: transfer.toAccountId,
      relatedDocumentId: transfer.id,
      amount: -transfer.amount,
      title: "โอนเงินออก",
      description: transfer.note,
      transactionDate: transfer.transferDate,
      createdAt: now,
    };
    
    const txDest: AppTransaction = {
      id: txDestId,
      userId,
      type: "transfer",
      accountId: transfer.toAccountId,
      relatedAccountId: transfer.fromAccountId,
      relatedDocumentId: transfer.id,
      amount: transfer.amount,
      title: "รับเงินโอนเข้า",
      description: transfer.note,
      transactionDate: transfer.transferDate,
      createdAt: now,
    };

    transaction.set(doc(db, "users", userId, "transactions", txSourceId), stripUndefinedFields(txSource));
    transaction.set(doc(db, "users", userId, "transactions", txDestId), stripUndefinedFields(txDest));

    // 5. Create Account Snapshots
    const snapSourceId = crypto.randomUUID();
    const snapDestId = crypto.randomUUID();

    const snapSource: AccountSnapshot = {
      id: snapSourceId,
      userId,
      accountId: transfer.fromAccountId,
      accountName: sourceData.accountName,
      balance: newSourceBalance,
      snapshotDate: transfer.transferDate,
      sourceType: "transfer",
      sourceId: transfer.id,
      createdAt: now,
    };

    const snapDest: AccountSnapshot = {
      id: snapDestId,
      userId,
      accountId: transfer.toAccountId,
      accountName: destData.accountName,
      balance: newDestBalance,
      snapshotDate: transfer.transferDate,
      sourceType: "transfer",
      sourceId: transfer.id,
      createdAt: now,
    };

    transaction.set(doc(db, "users", userId, "accountSnapshots", snapSourceId), stripUndefinedFields(snapSource));
    transaction.set(doc(db, "users", userId, "accountSnapshots", snapDestId), stripUndefinedFields(snapDest));
  });
};

export const deleteTransfer = async (userId: string, transferId: string): Promise<void> => {
  if (!userId) return;

  const transferRef = doc(db, "users", userId, "transfers", transferId);
  const transferDoc = await getDoc(transferRef);
  if (!transferDoc.exists()) return;

  const transfer = transferDoc.data() as Transfer;
  const transactionsQuery = query(
    collection(db, "users", userId, "transactions"),
    where("relatedDocumentId", "==", transferId)
  );
  const snapshotsQuery = query(
    collection(db, "users", userId, "accountSnapshots"),
    where("sourceId", "==", transferId)
  );

  const [transactionsSnap, snapshotsSnap] = await Promise.all([getDocs(transactionsQuery), getDocs(snapshotsQuery)]);

  await runTransaction(db, async (transaction) => {
    const sourceRef = doc(db, "users", userId, "accounts", transfer.fromAccountId);
    const destRef = doc(db, "users", userId, "accounts", transfer.toAccountId);
    const [sourceDoc, destDoc] = await Promise.all([transaction.get(sourceRef), transaction.get(destRef)]);

    if (sourceDoc.exists()) {
      const sourceData = sourceDoc.data() as Account;
      transaction.update(sourceRef, {
        currentBalance: sourceData.currentBalance + transfer.amount,
        updatedAt: new Date().toISOString(),
      });
    }

    if (destDoc.exists()) {
      const destData = destDoc.data() as Account;
      transaction.update(destRef, {
        currentBalance: destData.currentBalance - transfer.amount,
        updatedAt: new Date().toISOString(),
      });
    }

    transaction.delete(transferRef);
    transactionsSnap.forEach((docSnap) => transaction.delete(docSnap.ref));
    snapshotsSnap.forEach((docSnap) => transaction.delete(docSnap.ref));
  });
};

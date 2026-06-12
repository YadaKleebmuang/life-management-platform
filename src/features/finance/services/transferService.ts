import { db } from "@/lib/firebase";
import { collection, doc, getDocs, query, orderBy, runTransaction } from "firebase/firestore";
import { Transfer, Transaction as AppTransaction, AccountSnapshot, Account } from "../types";

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
    transaction.set(transferRef, transfer);

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

    transaction.set(doc(db, "users", userId, "transactions", txSourceId), txSource);
    transaction.set(doc(db, "users", userId, "transactions", txDestId), txDest);

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

    transaction.set(doc(db, "users", userId, "accountSnapshots", snapSourceId), snapSource);
    transaction.set(doc(db, "users", userId, "accountSnapshots", snapDestId), snapDest);
  });
};

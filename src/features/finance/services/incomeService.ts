import { db } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs, query, orderBy, runTransaction, type DocumentReference } from "firebase/firestore";
import { Income, Transaction as AppTransaction, AccountSnapshot, Account } from "../types";
import { getRelatedSnapshotRefs, getRelatedTransactionRefs } from "./relatedRecordService";

export const getIncomes = async (userId: string): Promise<Income[]> => {
  if (!userId) return [];
  const q = query(
    collection(db, "users", userId, "incomes"),
    orderBy("date", "desc")
  );
  const querySnapshot = await getDocs(q);
  const incomes: Income[] = [];
  querySnapshot.forEach((doc) => {
    incomes.push(doc.data() as Income);
  });
  return incomes;
};

export const saveIncome = async (userId: string, income: Income): Promise<void> => {
  if (!userId) return;

  const incomeRef = doc(db, "users", userId, "incomes", income.id);
  const existingIncomeDoc = await getDoc(incomeRef);
  const existingIncome = existingIncomeDoc.exists() ? (existingIncomeDoc.data() as Income) : null;
  const [relatedTransactionRefs, relatedSnapshotRefs]: [DocumentReference[], DocumentReference[]] = existingIncome
    ? await Promise.all([
        getRelatedTransactionRefs(userId, income.id),
        getRelatedSnapshotRefs(userId, income.id),
      ])
    : [[], []];

  await runTransaction(db, async (transaction) => {
    const now = new Date().toISOString();
    let snapshotAccountData: Account | null = null;
    let newBalance = 0;

    if (existingIncome) {
      if (existingIncome.accountId === income.accountId) {
        const accountRef = doc(db, "users", userId, "accounts", income.accountId);
        const accountDoc = await transaction.get(accountRef);

        if (!accountDoc.exists()) {
          throw new Error("Account does not exist!");
        }

        const accountData = accountDoc.data() as Account;
        newBalance = accountData.currentBalance - existingIncome.amount + income.amount;
        snapshotAccountData = accountData;
        transaction.update(accountRef, { currentBalance: newBalance, updatedAt: now });
      } else {
        const oldAccountRef = doc(db, "users", userId, "accounts", existingIncome.accountId);
        const oldAccountDoc = await transaction.get(oldAccountRef);

        if (oldAccountDoc.exists()) {
          const oldAccountData = oldAccountDoc.data() as Account;
          transaction.update(oldAccountRef, {
            currentBalance: oldAccountData.currentBalance - existingIncome.amount,
            updatedAt: now,
          });
        }

        const newAccountRef = doc(db, "users", userId, "accounts", income.accountId);
        const newAccountDoc = await transaction.get(newAccountRef);

        if (!newAccountDoc.exists()) {
          throw new Error("Account does not exist!");
        }

        const newAccountData = newAccountDoc.data() as Account;
        newBalance = newAccountData.currentBalance + income.amount;
        snapshotAccountData = newAccountData;
        transaction.update(newAccountRef, { currentBalance: newBalance, updatedAt: now });
      }

      relatedTransactionRefs.forEach((ref) => transaction.delete(ref));
      relatedSnapshotRefs.forEach((ref) => transaction.delete(ref));
    } else {
      const accountRef = doc(db, "users", userId, "accounts", income.accountId);
      const accountDoc = await transaction.get(accountRef);

      if (!accountDoc.exists()) {
        throw new Error("Account does not exist!");
      }

      const accountData = accountDoc.data() as Account;
      newBalance = accountData.currentBalance + income.amount;
      snapshotAccountData = accountData;
      transaction.update(accountRef, { currentBalance: newBalance, updatedAt: now });
    }

    transaction.set(incomeRef, income);

    // 4. Create Transaction Record
    const transactionId = crypto.randomUUID();
    const appTx: AppTransaction = {
      id: transactionId,
      userId,
      type: "income",
      accountId: income.accountId,
      relatedDocumentId: income.id,
      amount: income.amount,
      title: income.title,
      description: income.note,
      transactionDate: income.date,
      createdAt: now,
    };
    const txRef = doc(db, "users", userId, "transactions", transactionId);
    transaction.set(txRef, appTx);

    // 5. Create Account Snapshot
    const snapshotId = crypto.randomUUID();
    if (!snapshotAccountData) {
      throw new Error("Account data is missing!");
    }
    const snapshot: AccountSnapshot = {
      id: snapshotId,
      userId,
      accountId: income.accountId,
      accountName: snapshotAccountData.accountName,
      balance: newBalance,
      snapshotDate: income.date,
      sourceType: "income",
      sourceId: income.id,
      createdAt: now,
    };
    const snapRef = doc(db, "users", userId, "accountSnapshots", snapshotId);
    transaction.set(snapRef, snapshot);
  });
};

export const deleteIncome = async (userId: string, incomeId: string, accountId: string, amount: number): Promise<void> => {
  if (!userId) return;

  const incomeRef = doc(db, "users", userId, "incomes", incomeId);
  const incomeDoc = await getDoc(incomeRef);
  const incomeData = incomeDoc.exists() ? (incomeDoc.data() as Income) : null;
  const targetAccountId = incomeData?.accountId || accountId;
  const targetAmount = incomeData?.amount ?? amount;
  const [relatedTransactionRefs, relatedSnapshotRefs] = await Promise.all([
    getRelatedTransactionRefs(userId, incomeId),
    getRelatedSnapshotRefs(userId, incomeId),
  ]);

  await runTransaction(db, async (transaction) => {
    const accountRef = doc(db, "users", userId, "accounts", targetAccountId);
    const accountDoc = await transaction.get(accountRef);

    if (accountDoc.exists()) {
      const accountData = accountDoc.data() as Account;
      const newBalance = accountData.currentBalance - targetAmount;
      transaction.update(accountRef, { currentBalance: newBalance, updatedAt: new Date().toISOString() });
    }

    transaction.delete(incomeRef);
    relatedTransactionRefs.forEach((ref) => transaction.delete(ref));
    relatedSnapshotRefs.forEach((ref) => transaction.delete(ref));
  });
};

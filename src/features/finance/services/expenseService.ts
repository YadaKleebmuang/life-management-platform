import { db } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs, query, orderBy, runTransaction, type DocumentReference } from "firebase/firestore";
import { Expense, Transaction as AppTransaction, AccountSnapshot, Account } from "../types";
import { getRelatedSnapshotRefs, getRelatedTransactionRefs } from "./relatedRecordService";
import { stripUndefinedFields } from "../utils/stripUndefinedFields";

export const getExpenses = async (userId: string): Promise<Expense[]> => {
  if (!userId) return [];
  const q = query(
    collection(db, "users", userId, "expenses"),
    orderBy("date", "desc")
  );
  const querySnapshot = await getDocs(q);
  const expenses: Expense[] = [];
  querySnapshot.forEach((doc) => {
    expenses.push(doc.data() as Expense);
  });
  return expenses;
};

export const saveExpense = async (userId: string, expense: Expense): Promise<void> => {
  if (!userId) return;

  const expenseRef = doc(db, "users", userId, "expenses", expense.id);
  const existingExpenseDoc = await getDoc(expenseRef);
  const existingExpense = existingExpenseDoc.exists() ? (existingExpenseDoc.data() as Expense) : null;
  const [relatedTransactionRefs, relatedSnapshotRefs]: [DocumentReference[], DocumentReference[]] = existingExpense
    ? await Promise.all([
        getRelatedTransactionRefs(userId, expense.id),
        getRelatedSnapshotRefs(userId, expense.id),
      ])
    : [[], []];

  await runTransaction(db, async (transaction) => {
    const now = new Date().toISOString();
    let snapshotAccountData: Account | null = null;
    let newBalance = 0;

    if (existingExpense) {
      if (existingExpense.accountId === expense.accountId) {
        const accountRef = doc(db, "users", userId, "accounts", expense.accountId);
        const accountDoc = await transaction.get(accountRef);

        if (!accountDoc.exists()) {
          throw new Error("Account does not exist!");
        }

        const accountData = accountDoc.data() as Account;
        newBalance = accountData.currentBalance + existingExpense.amount - expense.amount;
        snapshotAccountData = accountData;
        transaction.update(accountRef, { currentBalance: newBalance, updatedAt: now });
      } else {
        const oldAccountRef = doc(db, "users", userId, "accounts", existingExpense.accountId);
        const oldAccountDoc = await transaction.get(oldAccountRef);

        if (oldAccountDoc.exists()) {
          const oldAccountData = oldAccountDoc.data() as Account;
          transaction.update(oldAccountRef, {
            currentBalance: oldAccountData.currentBalance + existingExpense.amount,
            updatedAt: now,
          });
        }

        const newAccountRef = doc(db, "users", userId, "accounts", expense.accountId);
        const newAccountDoc = await transaction.get(newAccountRef);

        if (!newAccountDoc.exists()) {
          throw new Error("Account does not exist!");
        }

        const newAccountData = newAccountDoc.data() as Account;
        newBalance = newAccountData.currentBalance - expense.amount;
        snapshotAccountData = newAccountData;
        transaction.update(newAccountRef, { currentBalance: newBalance, updatedAt: now });
      }

      relatedTransactionRefs.forEach((ref) => transaction.delete(ref));
      relatedSnapshotRefs.forEach((ref) => transaction.delete(ref));
    } else {
      const accountRef = doc(db, "users", userId, "accounts", expense.accountId);
      const accountDoc = await transaction.get(accountRef);

      if (!accountDoc.exists()) {
        throw new Error("Account does not exist!");
      }

      const accountData = accountDoc.data() as Account;
      newBalance = accountData.currentBalance - expense.amount;
      snapshotAccountData = accountData;
      transaction.update(accountRef, { currentBalance: newBalance, updatedAt: now });
    }

    transaction.set(expenseRef, stripUndefinedFields(expense));

    // 4. Create Transaction Record
    const transactionId = crypto.randomUUID();
    const appTx: AppTransaction = {
      id: transactionId,
      userId,
      type: "expense",
      accountId: expense.accountId,
      relatedDocumentId: expense.id,
      amount: -Math.abs(expense.amount), // Negative amount for expense
      title: expense.title,
      description: expense.note,
      transactionDate: expense.date,
      createdAt: now,
    };
    const txRef = doc(db, "users", userId, "transactions", transactionId);
    transaction.set(txRef, stripUndefinedFields(appTx));

    // 5. Create Account Snapshot
    const snapshotId = crypto.randomUUID();
    if (!snapshotAccountData) {
      throw new Error("Account data is missing!");
    }
    const snapshot: AccountSnapshot = {
      id: snapshotId,
      userId,
      accountId: expense.accountId,
      accountName: snapshotAccountData.accountName,
      balance: newBalance,
      snapshotDate: expense.date,
      sourceType: "expense",
      sourceId: expense.id,
      createdAt: now,
    };
    const snapRef = doc(db, "users", userId, "accountSnapshots", snapshotId);
    transaction.set(snapRef, stripUndefinedFields(snapshot));
  });
};

export const deleteExpense = async (userId: string, expenseId: string, accountId: string, amount: number): Promise<void> => {
  if (!userId) return;

  const expenseRef = doc(db, "users", userId, "expenses", expenseId);
  const expenseDoc = await getDoc(expenseRef);
  const expenseData = expenseDoc.exists() ? (expenseDoc.data() as Expense) : null;
  const targetAccountId = expenseData?.accountId || accountId;
  const targetAmount = expenseData?.amount ?? amount;
  const [relatedTransactionRefs, relatedSnapshotRefs] = await Promise.all([
    getRelatedTransactionRefs(userId, expenseId),
    getRelatedSnapshotRefs(userId, expenseId),
  ]);

  await runTransaction(db, async (transaction) => {
    const accountRef = doc(db, "users", userId, "accounts", targetAccountId);
    const accountDoc = await transaction.get(accountRef);

    if (accountDoc.exists()) {
      const accountData = accountDoc.data() as Account;
      const newBalance = accountData.currentBalance + targetAmount;
      transaction.update(accountRef, { currentBalance: newBalance, updatedAt: new Date().toISOString() });
    }

    transaction.delete(expenseRef);
    relatedTransactionRefs.forEach((ref) => transaction.delete(ref));
    relatedSnapshotRefs.forEach((ref) => transaction.delete(ref));
  });
};

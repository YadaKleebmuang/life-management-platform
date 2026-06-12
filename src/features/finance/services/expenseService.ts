import { db } from "@/lib/firebase";
import { collection, doc, getDocs, query, orderBy, runTransaction } from "firebase/firestore";
import { Expense, Transaction as AppTransaction, AccountSnapshot, Account } from "../types";

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

  await runTransaction(db, async (transaction) => {
    // 1. Fetch the account to get current balance
    const accountRef = doc(db, "users", userId, "accounts", expense.accountId);
    const accountDoc = await transaction.get(accountRef);
    
    if (!accountDoc.exists()) {
      throw new Error("Account does not exist!");
    }
    
    const accountData = accountDoc.data() as Account;
    const newBalance = accountData.currentBalance - expense.amount; // Minus for expense

    // 2. Update Account
    transaction.update(accountRef, { currentBalance: newBalance, updatedAt: new Date().toISOString() });

    // 3. Save Expense
    const expenseRef = doc(db, "users", userId, "expenses", expense.id);
    transaction.set(expenseRef, expense);

    // 4. Create Transaction Record
    const transactionId = crypto.randomUUID();
    const now = new Date().toISOString();
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
    transaction.set(txRef, appTx);

    // 5. Create Account Snapshot
    const snapshotId = crypto.randomUUID();
    const snapshot: AccountSnapshot = {
      id: snapshotId,
      userId,
      accountId: expense.accountId,
      accountName: accountData.accountName,
      balance: newBalance,
      snapshotDate: expense.date,
      sourceType: "expense",
      sourceId: expense.id,
      createdAt: now,
    };
    const snapRef = doc(db, "users", userId, "accountSnapshots", snapshotId);
    transaction.set(snapRef, snapshot);
  });
};

export const deleteExpense = async (userId: string, expenseId: string, accountId: string, amount: number): Promise<void> => {
  if (!userId) return;
  
  await runTransaction(db, async (transaction) => {
    const accountRef = doc(db, "users", userId, "accounts", accountId);
    const accountDoc = await transaction.get(accountRef);
    
    if (accountDoc.exists()) {
      const accountData = accountDoc.data() as Account;
      // Reverse the expense (add it back)
      const newBalance = accountData.currentBalance + amount;
      transaction.update(accountRef, { currentBalance: newBalance, updatedAt: new Date().toISOString() });
    }

    const expenseRef = doc(db, "users", userId, "expenses", expenseId);
    transaction.delete(expenseRef);
  });
};

import { db } from "@/lib/firebase";
import { collection, doc, getDocs, setDoc, deleteDoc, query, orderBy } from "firebase/firestore";
import { Expense } from "../types";

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
  const docRef = doc(db, "users", userId, "expenses", expense.id);
  await setDoc(docRef, expense);
};

export const deleteExpense = async (userId: string, expenseId: string): Promise<void> => {
  if (!userId) return;
  const docRef = doc(db, "users", userId, "expenses", expenseId);
  await deleteDoc(docRef);
};

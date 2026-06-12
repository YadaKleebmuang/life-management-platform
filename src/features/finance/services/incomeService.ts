import { db } from "@/lib/firebase";
import { collection, doc, getDocs, setDoc, deleteDoc, query, orderBy } from "firebase/firestore";
import { Income } from "../types";

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
  const docRef = doc(db, "users", userId, "incomes", income.id);
  await setDoc(docRef, income);
};

export const deleteIncome = async (userId: string, incomeId: string): Promise<void> => {
  if (!userId) return;
  const docRef = doc(db, "users", userId, "incomes", incomeId);
  await deleteDoc(docRef);
};

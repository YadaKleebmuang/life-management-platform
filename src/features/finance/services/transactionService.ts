import { db } from "@/lib/firebase";
import { collection, doc, getDocs, setDoc, query, orderBy } from "firebase/firestore";
import { Transaction } from "../types";
import { stripUndefinedFields } from "../utils/stripUndefinedFields";

export const getTransactions = async (userId: string): Promise<Transaction[]> => {
  if (!userId) return [];
  const q = query(
    collection(db, "users", userId, "transactions"),
    orderBy("transactionDate", "desc")
  );
  const querySnapshot = await getDocs(q);
  const transactions: Transaction[] = [];
  querySnapshot.forEach((doc) => {
    transactions.push(doc.data() as Transaction);
  });
  return transactions;
};

// saveTransaction is usually called inside a batch from other services (incomeService, expenseService)
// but we provide a standalone one just in case.
export const saveTransaction = async (userId: string, transaction: Transaction): Promise<void> => {
  if (!userId) return;
  const docRef = doc(db, "users", userId, "transactions", transaction.id);
  await setDoc(docRef, stripUndefinedFields(transaction));
};

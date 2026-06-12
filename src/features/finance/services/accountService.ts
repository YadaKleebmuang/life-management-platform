import { db } from "@/lib/firebase";
import { collection, doc, getDocs, setDoc, query, orderBy, deleteDoc } from "firebase/firestore";
import { Account } from "../types";

export const getAccounts = async (userId: string): Promise<Account[]> => {
  if (!userId) return [];
  const q = query(
    collection(db, "users", userId, "accounts"),
    orderBy("createdAt", "asc")
  );
  const querySnapshot = await getDocs(q);
  const accounts: Account[] = [];
  querySnapshot.forEach((doc) => {
    accounts.push(doc.data() as Account);
  });
  return accounts;
};

export const saveAccount = async (userId: string, account: Account): Promise<void> => {
  if (!userId) return;
  const docRef = doc(db, "users", userId, "accounts", account.id);
  await setDoc(docRef, account);
};

export const deleteAccount = async (userId: string, accountId: string): Promise<void> => {
  if (!userId) return;
  const docRef = doc(db, "users", userId, "accounts", accountId);
  await deleteDoc(docRef);
};

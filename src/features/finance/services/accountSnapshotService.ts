import { db } from "@/lib/firebase";
import { collection, doc, getDocs, setDoc, query, orderBy, where } from "firebase/firestore";
import { AccountSnapshot } from "../types";

export const getAccountSnapshots = async (userId: string, accountId?: string): Promise<AccountSnapshot[]> => {
  if (!userId) return [];
  
  let q;
  if (accountId) {
    q = query(
      collection(db, "users", userId, "accountSnapshots"),
      where("accountId", "==", accountId),
      orderBy("snapshotDate", "desc"),
      orderBy("createdAt", "desc")
    );
  } else {
    q = query(
      collection(db, "users", userId, "accountSnapshots"),
      orderBy("snapshotDate", "desc"),
      orderBy("createdAt", "desc")
    );
  }

  const querySnapshot = await getDocs(q);
  const snapshots: AccountSnapshot[] = [];
  querySnapshot.forEach((doc) => {
    snapshots.push(doc.data() as AccountSnapshot);
  });
  return snapshots;
};

// Usually called inside a batch
export const saveAccountSnapshot = async (userId: string, snapshot: AccountSnapshot): Promise<void> => {
  if (!userId) return;
  const docRef = doc(db, "users", userId, "accountSnapshots", snapshot.id);
  await setDoc(docRef, snapshot);
};

import { collection, getDocs, query, where, type DocumentReference } from "firebase/firestore";
import { db } from "@/lib/firebase";

export const getRelatedTransactionRefs = async (
  userId: string,
  relatedDocumentId: string
): Promise<DocumentReference[]> => {
  if (!userId || !relatedDocumentId) return [];

  const q = query(
    collection(db, "users", userId, "transactions"),
    where("relatedDocumentId", "==", relatedDocumentId)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => docSnap.ref);
};

export const getRelatedSnapshotRefs = async (
  userId: string,
  sourceId: string
): Promise<DocumentReference[]> => {
  if (!userId || !sourceId) return [];

  const q = query(
    collection(db, "users", userId, "accountSnapshots"),
    where("sourceId", "==", sourceId)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => docSnap.ref);
};

import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { BudgetAllocation } from "../types";

const defaultAllocation: BudgetAllocation = {
  spendingPercentage: 60,
  savingsPercentage: 20,
  emergencyFundPercentage: 20,
};

export const getAllocation = async (userId: string): Promise<BudgetAllocation> => {
  if (!userId) return defaultAllocation;
  
  const docRef = doc(db, "users", userId, "budget", "allocation");
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return docSnap.data() as BudgetAllocation;
  } else {
    // Return default and also save it to Firestore for future use
    await setDoc(docRef, defaultAllocation);
    return defaultAllocation;
  }
};

export const saveAllocation = async (userId: string, allocation: BudgetAllocation): Promise<void> => {
  if (!userId) return;
  const docRef = doc(db, "users", userId, "budget", "allocation");
  await setDoc(docRef, allocation);
};

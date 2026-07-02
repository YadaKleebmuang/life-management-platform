import { db } from "@/lib/firebase";
import { collection, doc, getDocs, query, orderBy, setDoc, deleteDoc, runTransaction } from "firebase/firestore";
import { SavingsGoal, GoalAllocation } from "../types";
import { stripUndefinedFields } from "../utils/stripUndefinedFields";

export const getSavingsGoals = async (userId: string): Promise<SavingsGoal[]> => {
  if (!userId) return [];
  const q = query(
    collection(db, "users", userId, "savingsGoals"),
    orderBy("createdAt", "desc")
  );
  const querySnapshot = await getDocs(q);
  const goals: SavingsGoal[] = [];
  querySnapshot.forEach((doc) => {
    goals.push(doc.data() as SavingsGoal);
  });
  return goals;
};

export const getGoalAllocations = async (userId: string, goalId: string): Promise<GoalAllocation[]> => {
  if (!userId || !goalId) return [];
  const q = query(
    collection(db, "users", userId, "savingsGoals", goalId, "allocations"),
    orderBy("date", "desc")
  );
  const querySnapshot = await getDocs(q);
  const allocations: GoalAllocation[] = [];
  querySnapshot.forEach((doc) => {
    allocations.push(doc.data() as GoalAllocation);
  });
  return allocations;
};

export const saveSavingsGoal = async (userId: string, goal: SavingsGoal): Promise<void> => {
  if (!userId) return;
  const docRef = doc(db, "users", userId, "savingsGoals", goal.id);
  await setDoc(docRef, stripUndefinedFields(goal));
};

export const deleteSavingsGoal = async (userId: string, goalId: string): Promise<void> => {
  if (!userId) return;
  const docRef = doc(db, "users", userId, "savingsGoals", goalId);
  await deleteDoc(docRef);
  // Note: Allocations subcollection might be orphaned, but for this scale, it's acceptable.
  // In a robust implementation, a Cloud Function or batch delete of subcollection would be used.
};

export const allocateMoneyToGoal = async (
  userId: string, 
  goalId: string, 
  accountId: string, 
  amount: number, 
  type: "add" | "withdraw",
  date: string,
  note?: string
): Promise<void> => {
  if (!userId) return;

  await runTransaction(db, async (transaction) => {
    const goalRef = doc(db, "users", userId, "savingsGoals", goalId);
    const goalDoc = await transaction.get(goalRef);
    
    if (!goalDoc.exists()) {
      throw new Error("Goal does not exist!");
    }
    
    const goalData = goalDoc.data() as SavingsGoal;
    
    let newCurrentAmount = goalData.currentAmount;
    if (type === "add") {
      newCurrentAmount += amount;
    } else {
      newCurrentAmount -= amount;
      if (newCurrentAmount < 0) newCurrentAmount = 0;
    }

    // 1. Update Goal
    transaction.update(goalRef, { 
      currentAmount: newCurrentAmount, 
      updatedAt: new Date().toISOString() 
    });

    // 2. Save Allocation Record (Virtual movement, NO account balance deduction)
    const allocationId = crypto.randomUUID();
    const allocationRef = doc(db, "users", userId, "savingsGoals", goalId, "allocations", allocationId);
    
    const allocation: GoalAllocation = {
      id: allocationId,
      userId,
      goalId,
      accountId,
      amount,
      type,
      date,
      note,
      createdAt: new Date().toISOString(),
    };
    
    transaction.set(allocationRef, stripUndefinedFields(allocation));
  });
};

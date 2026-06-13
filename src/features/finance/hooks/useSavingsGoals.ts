"use client";

import { useState, useEffect, useCallback } from "react";
import { SavingsGoal } from "../types";
import { 
  getSavingsGoals, 
  saveSavingsGoal, 
  deleteSavingsGoal,
  allocateMoneyToGoal
} from "../services/savingsGoalService";
import { useAuth } from "@/features/auth/contexts/AuthContext";

export function useSavingsGoals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);

  const loadGoals = useCallback(async () => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const loaded = await getSavingsGoals(user.uid);
      setGoals(loaded);
    } catch (error) {
      console.error("Error loading savings goals:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  const addGoal = async (goalData: Omit<SavingsGoal, "id" | "userId" | "currentAmount" | "createdAt" | "updatedAt">) => {
    if (!user?.uid) return;
    const now = new Date().toISOString();
    
    const newGoal: SavingsGoal = {
      ...goalData,
      id: crypto.randomUUID(),
      userId: user.uid,
      currentAmount: 0,
      createdAt: now,
      updatedAt: now,
    };
    await saveSavingsGoal(user.uid, newGoal);
    await loadGoals();
  };

  const updateGoal = async (goal: SavingsGoal) => {
    if (!user?.uid) return;
    const updated = {
      ...goal,
      updatedAt: new Date().toISOString()
    };
    await saveSavingsGoal(user.uid, updated);
    await loadGoals();
  };

  const removeGoal = async (goalId: string) => {
    if (!user?.uid) return;
    await deleteSavingsGoal(user.uid, goalId);
    await loadGoals();
  };

  const allocateFunds = async (goalId: string, accountId: string, amount: number, type: "add" | "withdraw", date: string, note?: string) => {
    if (!user?.uid) return;
    await allocateMoneyToGoal(user.uid, goalId, accountId, amount, type, date, note);
    await loadGoals();
  };

  return {
    goals,
    loading,
    addGoal,
    updateGoal,
    removeGoal,
    allocateFunds,
    refreshGoals: loadGoals,
  };
}

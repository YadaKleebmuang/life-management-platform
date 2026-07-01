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
  const userId = user?.uid ?? "";
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);

  const loadGoals = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const loaded = await getSavingsGoals(userId);
      setGoals(loaded);
    } catch (error) {
      console.error("Error loading savings goals:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadGoals();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadGoals]);

  const addGoal = async (goalData: Omit<SavingsGoal, "id" | "userId" | "currentAmount" | "createdAt" | "updatedAt">) => {
    if (!userId) return;
    const now = new Date().toISOString();
    
    const newGoal: SavingsGoal = {
      ...goalData,
      id: crypto.randomUUID(),
      userId,
      currentAmount: 0,
      createdAt: now,
      updatedAt: now,
    };
    await saveSavingsGoal(userId, newGoal);
    await loadGoals();
  };

  const updateGoal = async (goal: SavingsGoal) => {
    if (!userId) return;
    const updated = {
      ...goal,
      updatedAt: new Date().toISOString()
    };
    await saveSavingsGoal(userId, updated);
    await loadGoals();
  };

  const removeGoal = async (goalId: string) => {
    if (!userId) return;
    await deleteSavingsGoal(userId, goalId);
    await loadGoals();
  };

  const allocateFunds = async (goalId: string, accountId: string, amount: number, type: "add" | "withdraw", date: string, note?: string) => {
    if (!userId) return;
    await allocateMoneyToGoal(userId, goalId, accountId, amount, type, date, note);
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

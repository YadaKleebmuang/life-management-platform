"use client";

import { useState, useEffect, useCallback } from "react";
import { Goal, GoalContribution, GoalStatus } from "../types";
import { getGoals, saveGoal, addGoalContribution, getGoalContributions } from "../services/goalService";
import { useAuth } from "@/features/auth/contexts/AuthContext";

export function useGoals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  const loadGoals = useCallback(async () => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const loaded = await getGoals(user.uid);
      setGoals(loaded);
    } catch (error) {
      console.error("Error loading goals:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  const addGoal = async (goalData: Omit<Goal, "id" | "userId" | "createdAt" | "updatedAt" | "currentAmount" | "status">) => {
    if (!user?.uid) return;
    const now = new Date().toISOString();
    const newGoal: Goal = {
      ...goalData,
      id: crypto.randomUUID(),
      userId: user.uid,
      currentAmount: 0,
      status: "active",
      createdAt: now,
      updatedAt: now,
    };
    await saveGoal(user.uid, newGoal);
    await loadGoals();
  };

  const updateGoal = async (goal: Goal) => {
    if (!user?.uid) return;
    const updated = { ...goal, updatedAt: new Date().toISOString() };
    await saveGoal(user.uid, updated);
    await loadGoals();
  };

  const addContribution = async (contributionData: Omit<GoalContribution, "id" | "userId" | "createdAt">) => {
    if (!user?.uid) return;
    const now = new Date().toISOString();
    const newContribution: GoalContribution = {
      ...contributionData,
      id: crypto.randomUUID(),
      userId: user.uid,
      createdAt: now,
    };
    await addGoalContribution(user.uid, newContribution);
    await loadGoals();
  };

  const fetchContributions = async (goalId: string) => {
    if (!user?.uid) return [];
    return await getGoalContributions(user.uid, goalId);
  };

  return {
    goals,
    loading,
    addGoal,
    updateGoal,
    addContribution,
    fetchContributions,
    refreshGoals: loadGoals,
  };
}

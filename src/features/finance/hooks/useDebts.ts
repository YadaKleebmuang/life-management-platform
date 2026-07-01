"use client";

import { useState, useEffect, useCallback } from "react";
import { Debt, DebtRepayment } from "../types";
import { getDebts, saveDebt, repayDebt, getDebtRepayments } from "../services/debtService";
import { useAuth } from "@/features/auth/contexts/AuthContext";

export function useDebts() {
  const { user } = useAuth();
  const userId = user?.uid ?? "";
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDebts = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const loaded = await getDebts(userId);
      setDebts(loaded);
    } catch (error) {
      console.error("Error loading debts:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDebts();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadDebts]);

  const addDebt = async (debtData: Omit<Debt, "id" | "userId" | "createdAt" | "updatedAt" | "remainingAmount" | "status">) => {
    if (!userId) return;
    const now = new Date().toISOString();
    const newDebt: Debt = {
      ...debtData,
      id: crypto.randomUUID(),
      userId,
      remainingAmount: debtData.amount,
      status: "unpaid",
      createdAt: now,
      updatedAt: now,
    };
    await saveDebt(userId, newDebt);
    await loadDebts();
  };

  const addRepayment = async (repaymentData: Omit<DebtRepayment, "id" | "userId" | "createdAt">) => {
    if (!userId) return;
    const now = new Date().toISOString();
    const newRepayment: DebtRepayment = {
      ...repaymentData,
      id: crypto.randomUUID(),
      userId,
      createdAt: now,
    };
    await repayDebt(userId, newRepayment);
    await loadDebts();
  };

  const fetchRepayments = async (debtId: string) => {
    if (!userId) return [];
    return await getDebtRepayments(userId, debtId);
  };

  const borrowedDebts = debts.filter((d) => d.debtType === "borrowed");
  const lentDebts = debts.filter((d) => d.debtType === "lent");

  return {
    debts,
    borrowedDebts,
    lentDebts,
    loading,
    addDebt,
    addRepayment,
    fetchRepayments,
    refreshDebts: loadDebts,
  };
}

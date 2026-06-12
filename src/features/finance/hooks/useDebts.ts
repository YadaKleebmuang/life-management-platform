"use client";

import { useState, useEffect, useCallback } from "react";
import { Debt, DebtRepayment, DebtType } from "../types";
import { getDebts, saveDebt, repayDebt, getDebtRepayments } from "../services/debtService";
import { useAuth } from "@/features/auth/contexts/AuthContext";

export function useDebts() {
  const { user } = useAuth();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDebts = useCallback(async () => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const loaded = await getDebts(user.uid);
      setDebts(loaded);
    } catch (error) {
      console.error("Error loading debts:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    loadDebts();
  }, [loadDebts]);

  const addDebt = async (debtData: Omit<Debt, "id" | "userId" | "createdAt" | "updatedAt" | "remainingAmount" | "status">) => {
    if (!user?.uid) return;
    const now = new Date().toISOString();
    const newDebt: Debt = {
      ...debtData,
      id: crypto.randomUUID(),
      userId: user.uid,
      remainingAmount: debtData.amount,
      status: "unpaid",
      createdAt: now,
      updatedAt: now,
    };
    await saveDebt(user.uid, newDebt);
    await loadDebts();
  };

  const addRepayment = async (repaymentData: Omit<DebtRepayment, "id" | "userId" | "createdAt">) => {
    if (!user?.uid) return;
    const now = new Date().toISOString();
    const newRepayment: DebtRepayment = {
      ...repaymentData,
      id: crypto.randomUUID(),
      userId: user.uid,
      createdAt: now,
    };
    await repayDebt(user.uid, newRepayment);
    await loadDebts();
  };

  const fetchRepayments = async (debtId: string) => {
    if (!user?.uid) return [];
    return await getDebtRepayments(user.uid, debtId);
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

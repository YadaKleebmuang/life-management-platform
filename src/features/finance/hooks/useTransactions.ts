"use client";

import { useState, useEffect, useCallback } from "react";
import { Transaction } from "../types";
import { getTransactions } from "../services/transactionService";
import { useAuth } from "@/features/auth/contexts/AuthContext";
import { subscribeFinanceChanged } from "../utils/financeEvents";

export function useTransactions() {
  const { user } = useAuth();
  const userId = user?.uid ?? "";
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTransactions = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const loaded = await getTransactions(userId);
      setTransactions(loaded);
    } catch (error) {
      console.error("Error loading transactions:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadTransactions();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadTransactions]);

  useEffect(() => subscribeFinanceChanged(loadTransactions), [loadTransactions]);

  return {
    transactions,
    loading,
    refreshTransactions: loadTransactions
  };
}

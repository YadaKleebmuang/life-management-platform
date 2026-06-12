"use client";

import { useState, useEffect, useCallback } from "react";
import { Transaction } from "../types";
import { getTransactions } from "../services/transactionService";
import { useAuth } from "@/features/auth/contexts/AuthContext";

export function useTransactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTransactions = useCallback(async () => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const loaded = await getTransactions(user.uid);
      setTransactions(loaded);
    } catch (error) {
      console.error("Error loading transactions:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  return {
    transactions,
    loading,
    refreshTransactions: loadTransactions
  };
}

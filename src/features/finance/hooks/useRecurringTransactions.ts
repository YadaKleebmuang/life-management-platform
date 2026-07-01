"use client";

import { useState, useEffect, useCallback } from "react";
import { RecurringTransaction } from "../types";
import { 
  getRecurringTransactions, 
  saveRecurringTransaction, 
  deleteRecurringTransaction,
  processRecurringTransactions 
} from "../services/recurringTransactionService";
import { useAuth } from "@/features/auth/contexts/AuthContext";

export function useRecurringTransactions() {
  const { user } = useAuth();
  const userId = user?.uid ?? "";
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTransactions = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const loaded = await getRecurringTransactions(userId);
      setRecurringTransactions(loaded);
    } catch (error) {
      console.error("Error loading recurring transactions:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Optionally trigger automation on load
  const triggerAutomation = useCallback(async () => {
    if (!userId) return 0;
    try {
      const processedCount = await processRecurringTransactions(userId);
      if (processedCount > 0) {
        await loadTransactions();
      }
      return processedCount;
    } catch (error) {
      console.error("Error processing recurring transactions:", error);
      return 0;
    }
  }, [userId, loadTransactions]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadTransactions();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadTransactions]);

  const addTransaction = async (txData: Omit<RecurringTransaction, "id" | "userId" | "createdAt" | "updatedAt" | "nextRunDate" | "isActive">) => {
    if (!userId) return;
    const now = new Date().toISOString();
    
    // Calculate initial nextRunDate (same as startDate)
    const nextRunDate = txData.startDate;

    const newTx: RecurringTransaction = {
      ...txData,
      id: crypto.randomUUID(),
      userId,
      isActive: true,
      nextRunDate,
      createdAt: now,
      updatedAt: now,
    };
    await saveRecurringTransaction(userId, newTx);
    await loadTransactions();
  };

  const toggleStatus = async (tx: RecurringTransaction) => {
    if (!userId) return;
    const updated = { 
      ...tx, 
      isActive: !tx.isActive,
      updatedAt: new Date().toISOString() 
    };
    await saveRecurringTransaction(userId, updated);
    await loadTransactions();
  };

  const removeTransaction = async (txId: string) => {
    if (!userId) return;
    await deleteRecurringTransaction(userId, txId);
    await loadTransactions();
  };

  return {
    recurringTransactions,
    loading,
    addTransaction,
    toggleStatus,
    removeTransaction,
    refreshTransactions: loadTransactions,
    triggerAutomation
  };
}

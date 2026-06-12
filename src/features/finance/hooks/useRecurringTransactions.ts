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
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTransactions = useCallback(async () => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const loaded = await getRecurringTransactions(user.uid);
      setRecurringTransactions(loaded);
    } catch (error) {
      console.error("Error loading recurring transactions:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  // Optionally trigger automation on load
  const triggerAutomation = useCallback(async () => {
    if (!user?.uid) return 0;
    try {
      const processedCount = await processRecurringTransactions(user.uid);
      if (processedCount > 0) {
        await loadTransactions();
      }
      return processedCount;
    } catch (error) {
      console.error("Error processing recurring transactions:", error);
      return 0;
    }
  }, [user?.uid, loadTransactions]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const addTransaction = async (txData: Omit<RecurringTransaction, "id" | "userId" | "createdAt" | "updatedAt" | "nextRunDate" | "isActive">) => {
    if (!user?.uid) return;
    const now = new Date().toISOString();
    
    // Calculate initial nextRunDate (same as startDate)
    const nextRunDate = txData.startDate;

    const newTx: RecurringTransaction = {
      ...txData,
      id: crypto.randomUUID(),
      userId: user.uid,
      isActive: true,
      nextRunDate,
      createdAt: now,
      updatedAt: now,
    };
    await saveRecurringTransaction(user.uid, newTx);
    await loadTransactions();
  };

  const toggleStatus = async (tx: RecurringTransaction) => {
    if (!user?.uid) return;
    const updated = { 
      ...tx, 
      isActive: !tx.isActive,
      updatedAt: new Date().toISOString() 
    };
    await saveRecurringTransaction(user.uid, updated);
    await loadTransactions();
  };

  const removeTransaction = async (txId: string) => {
    if (!user?.uid) return;
    await deleteRecurringTransaction(user.uid, txId);
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

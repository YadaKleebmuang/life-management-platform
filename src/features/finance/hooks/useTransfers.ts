"use client";

import { useState, useEffect, useCallback } from "react";
import { Transfer } from "../types";
import { getTransfers, saveTransfer } from "../services/transferService";
import { useAuth } from "@/features/auth/contexts/AuthContext";
import { notifyFinanceChanged } from "../utils/financeEvents";

export function useTransfers() {
  const { user } = useAuth();
  const userId = user?.uid ?? "";
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTransfers = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const loaded = await getTransfers(userId);
      setTransfers(loaded);
    } catch (error) {
      console.error("Error loading transfers:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadTransfers();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadTransfers]);

  const addTransfer = async (transferData: Omit<Transfer, "id" | "userId" | "createdAt">) => {
    if (!userId) return;
    const now = new Date().toISOString();
    const newTransfer: Transfer = {
      ...transferData,
      id: crypto.randomUUID(),
      userId,
      createdAt: now,
    };
    await saveTransfer(userId, newTransfer);
    await loadTransfers();
    notifyFinanceChanged();
  };

  return {
    transfers,
    loading,
    addTransfer,
    refreshTransfers: loadTransfers
  };
}

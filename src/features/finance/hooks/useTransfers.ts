"use client";

import { useState, useEffect, useCallback } from "react";
import { Transfer } from "../types";
import { getTransfers, saveTransfer } from "../services/transferService";
import { useAuth } from "@/features/auth/contexts/AuthContext";

export function useTransfers() {
  const { user } = useAuth();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTransfers = useCallback(async () => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const loaded = await getTransfers(user.uid);
      setTransfers(loaded);
    } catch (error) {
      console.error("Error loading transfers:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    loadTransfers();
  }, [loadTransfers]);

  const addTransfer = async (transferData: Omit<Transfer, "id" | "userId" | "createdAt">) => {
    if (!user?.uid) return;
    const now = new Date().toISOString();
    const newTransfer: Transfer = {
      ...transferData,
      id: crypto.randomUUID(),
      userId: user.uid,
      createdAt: now,
    };
    await saveTransfer(user.uid, newTransfer);
    await loadTransfers();
  };

  return {
    transfers,
    loading,
    addTransfer,
    refreshTransfers: loadTransfers
  };
}

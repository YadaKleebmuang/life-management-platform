"use client";

import { useState, useEffect, useCallback } from "react";
import { Account } from "../types";
import { getAccounts, saveAccount, deleteAccount } from "../services/accountService";
import { useAuth } from "@/features/auth/contexts/AuthContext";
import { subscribeFinanceChanged } from "../utils/financeEvents";

export function useAccounts() {
  const { user } = useAuth();
  const userId = user?.uid ?? "";
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAccounts = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const loaded = await getAccounts(userId);
      setAccounts(loaded);
    } catch (error) {
      console.error("Error loading accounts:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadAccounts();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadAccounts]);

  useEffect(() => subscribeFinanceChanged(loadAccounts), [loadAccounts]);

  const addAccount = async (accountData: Omit<Account, "id" | "userId" | "createdAt" | "updatedAt" | "currentBalance">) => {
    if (!userId) return;
    const now = new Date().toISOString();
    const newAccount: Account = {
      ...accountData,
      id: crypto.randomUUID(),
      userId,
      currentBalance: accountData.initialBalance,
      createdAt: now,
      updatedAt: now,
    };
    await saveAccount(userId, newAccount);
    await loadAccounts();
  };

  const updateAccount = async (account: Account) => {
    if (!userId) return;
    const updated = { ...account, updatedAt: new Date().toISOString() };
    await saveAccount(userId, updated);
    await loadAccounts();
  };

  const removeAccount = async (id: string) => {
    if (!userId) return;
    await deleteAccount(userId, id);
    await loadAccounts();
  };

  const toggleAccountActive = async (account: Account) => {
    if (!userId) return;
    const updated = { ...account, isActive: !account.isActive, updatedAt: new Date().toISOString() };
    await saveAccount(userId, updated);
    await loadAccounts();
  };

  const activeAccounts = accounts.filter(a => a.isActive);

  return {
    accounts,
    activeAccounts,
    loading,
    addAccount,
    updateAccount,
    removeAccount,
    toggleAccountActive,
    refreshAccounts: loadAccounts
  };
}

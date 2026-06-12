"use client";

import { useState, useEffect, useCallback } from "react";
import { Account, AccountType } from "../types";
import { getAccounts, saveAccount, deleteAccount } from "../services/accountService";
import { useAuth } from "@/features/auth/contexts/AuthContext";

export function useAccounts() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAccounts = useCallback(async () => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const loaded = await getAccounts(user.uid);
      setAccounts(loaded);
    } catch (error) {
      console.error("Error loading accounts:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const addAccount = async (accountData: Omit<Account, "id" | "userId" | "createdAt" | "updatedAt" | "currentBalance">) => {
    if (!user?.uid) return;
    const now = new Date().toISOString();
    const newAccount: Account = {
      ...accountData,
      id: crypto.randomUUID(),
      userId: user.uid,
      currentBalance: accountData.initialBalance,
      createdAt: now,
      updatedAt: now,
    };
    await saveAccount(user.uid, newAccount);
    await loadAccounts();
  };

  const updateAccount = async (account: Account) => {
    if (!user?.uid) return;
    const updated = { ...account, updatedAt: new Date().toISOString() };
    await saveAccount(user.uid, updated);
    await loadAccounts();
  };

  const removeAccount = async (id: string) => {
    if (!user?.uid) return;
    await deleteAccount(user.uid, id);
    await loadAccounts();
  };

  const toggleAccountActive = async (account: Account) => {
    if (!user?.uid) return;
    const updated = { ...account, isActive: !account.isActive, updatedAt: new Date().toISOString() };
    await saveAccount(user.uid, updated);
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

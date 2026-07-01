"use client";

import { useState, useEffect, useCallback } from "react";
import { Income, Expense, BudgetAllocation, FinanceSummary } from "../types";
import { getIncomes, saveIncome, deleteIncome } from "../services/incomeService";
import { getExpenses, saveExpense, deleteExpense } from "../services/expenseService";
import { getAllocation, saveAllocation } from "../services/budgetService";
import { calculateSummary } from "../utils/calculations";
import { useAuth } from "@/features/auth/contexts/AuthContext";
import { notifyFinanceChanged } from "../utils/financeEvents";

export function useFinanceData() {
  const { user } = useAuth();
  const userId = user?.uid ?? "";
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [allocation, setAllocation] = useState<BudgetAllocation>({
    spendingPercentage: 60,
    savingsPercentage: 20,
    emergencyFundPercentage: 20,
  });
  const [summary, setSummary] = useState<FinanceSummary>({
    totalIncome: 0,
    totalExpenses: 0,
    balance: 0,
    savings: 0,
    emergencyFund: 0,
    dailyBudget: 0,
  });
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [loadedIncomes, loadedExpenses, loadedAllocation] = await Promise.all([
        getIncomes(userId),
        getExpenses(userId),
        getAllocation(userId),
      ]);

      setIncomes(loadedIncomes);
      setExpenses(loadedExpenses);
      setAllocation(loadedAllocation);

      const calculatedSummary = calculateSummary(
        loadedIncomes,
        loadedExpenses,
        loadedAllocation
      );
      setSummary(calculatedSummary);
    } catch (error) {
      console.error("Error loading finance data:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadData]);

  // Income Methods
  const addIncome = async (income: Omit<Income, "id" | "createdAt">) => {
    if (!userId) return;
    const newIncome: Income = {
      ...income,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    await saveIncome(userId, newIncome);
    await loadData();
    notifyFinanceChanged();
  };

  const updateIncome = async (income: Income) => {
    if (!userId) return;
    await saveIncome(userId, income);
    await loadData();
    notifyFinanceChanged();
  };

  const removeIncome = async (income: Income) => {
    if (!userId) return;
    await deleteIncome(userId, income.id, income.accountId, income.amount);
    await loadData();
    notifyFinanceChanged();
  };

  // Expense Methods
  const addExpense = async (expense: Omit<Expense, "id" | "createdAt">) => {
    if (!userId) return;
    const newExpense: Expense = {
      ...expense,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    await saveExpense(userId, newExpense);
    await loadData();
    notifyFinanceChanged();
  };

  const updateExpense = async (expense: Expense) => {
    if (!userId) return;
    await saveExpense(userId, expense);
    await loadData();
    notifyFinanceChanged();
  };

  const removeExpense = async (expense: Expense) => {
    if (!userId) return;
    await deleteExpense(userId, expense.id, expense.accountId, expense.amount);
    await loadData();
    notifyFinanceChanged();
  };

  // Allocation Methods
  const updateAllocation = async (newAllocation: BudgetAllocation) => {
    if (!userId) return;
    await saveAllocation(userId, newAllocation);
    await loadData();
  };

  return {
    incomes,
    expenses,
    allocation,
    summary,
    loading,
    addIncome,
    updateIncome,
    removeIncome,
    addExpense,
    updateExpense,
    removeExpense,
    updateAllocation,
  };
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { Income, Expense, BudgetAllocation, FinanceSummary } from "../types";
import { getIncomes, saveIncome, deleteIncome } from "../services/incomeService";
import { getExpenses, saveExpense, deleteExpense } from "../services/expenseService";
import { getAllocation, saveAllocation } from "../services/budgetService";
import { calculateSummary } from "../utils/calculations";
import { useAuth } from "@/features/auth/contexts/AuthContext";

export function useFinanceData() {
  const { user } = useAuth();
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
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [loadedIncomes, loadedExpenses, loadedAllocation] = await Promise.all([
        getIncomes(user.uid),
        getExpenses(user.uid),
        getAllocation(user.uid),
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
  }, [user?.uid]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Income Methods
  const addIncome = async (income: Omit<Income, "id" | "createdAt">) => {
    if (!user?.uid) return;
    const newIncome: Income = {
      ...income,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    await saveIncome(user.uid, newIncome);
    await loadData();
  };

  const updateIncome = async (income: Income) => {
    if (!user?.uid) return;
    await saveIncome(user.uid, income);
    await loadData();
  };

  const removeIncome = async (income: Income) => {
    if (!user?.uid) return;
    await deleteIncome(user.uid, income.id, income.accountId, income.amount);
    await loadData();
  };

  // Expense Methods
  const addExpense = async (expense: Omit<Expense, "id" | "createdAt">) => {
    if (!user?.uid) return;
    const newExpense: Expense = {
      ...expense,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    await saveExpense(user.uid, newExpense);
    await loadData();
  };

  const updateExpense = async (expense: Expense) => {
    if (!user?.uid) return;
    await saveExpense(user.uid, expense);
    await loadData();
  };

  const removeExpense = async (expense: Expense) => {
    if (!user?.uid) return;
    await deleteExpense(user.uid, expense.id, expense.accountId, expense.amount);
    await loadData();
  };

  // Allocation Methods
  const updateAllocation = async (newAllocation: BudgetAllocation) => {
    if (!user?.uid) return;
    await saveAllocation(user.uid, newAllocation);
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

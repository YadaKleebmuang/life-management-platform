"use client";

import { useState, useEffect, useCallback } from "react";
import { Income, Expense, BudgetAllocation, FinanceSummary } from "../types";
import {
  getIncomes,
  saveIncome,
  deleteIncome,
  getExpenses,
  saveExpense,
  deleteExpense,
  getAllocation,
  saveAllocation,
} from "../services/storage";
import { calculateSummary } from "../utils/calculations";

export function useFinanceData() {
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

  const loadData = useCallback(() => {
    const loadedIncomes = getIncomes();
    const loadedExpenses = getExpenses();
    const loadedAllocation = getAllocation();

    setIncomes(loadedIncomes);
    setExpenses(loadedExpenses);
    setAllocation(loadedAllocation);

    const calculatedSummary = calculateSummary(
      loadedIncomes,
      loadedExpenses,
      loadedAllocation
    );
    setSummary(calculatedSummary);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Income Methods
  const addIncome = (income: Omit<Income, "id" | "createdAt">) => {
    const newIncome: Income = {
      ...income,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    saveIncome(newIncome);
    loadData();
  };

  const updateIncome = (income: Income) => {
    saveIncome(income);
    loadData();
  };

  const removeIncome = (id: string) => {
    deleteIncome(id);
    loadData();
  };

  // Expense Methods
  const addExpense = (expense: Omit<Expense, "id" | "createdAt">) => {
    const newExpense: Expense = {
      ...expense,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    saveExpense(newExpense);
    loadData();
  };

  const updateExpense = (expense: Expense) => {
    saveExpense(expense);
    loadData();
  };

  const removeExpense = (id: string) => {
    deleteExpense(id);
    loadData();
  };

  // Allocation Methods
  const updateAllocation = (newAllocation: BudgetAllocation) => {
    saveAllocation(newAllocation);
    loadData();
  };

  return {
    incomes,
    expenses,
    allocation,
    summary,
    addIncome,
    updateIncome,
    removeIncome,
    addExpense,
    updateExpense,
    removeExpense,
    updateAllocation,
  };
}

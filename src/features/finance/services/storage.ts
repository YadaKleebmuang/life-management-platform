import { Income, Expense, BudgetAllocation } from "../types";

const STORAGE_KEY_INCOMES = "finance_incomes";
const STORAGE_KEY_EXPENSES = "finance_expenses";
const STORAGE_KEY_ALLOCATION = "finance_allocation";

const defaultAllocation: BudgetAllocation = {
  spendingPercentage: 60,
  savingsPercentage: 20,
  emergencyFundPercentage: 20,
};

// Generic storage getters/setters
const getFromStorage = <T>(key: string, defaultValue: T): T => {
  if (typeof window === "undefined") return defaultValue;
  const stored = localStorage.getItem(key);
  if (!stored) return defaultValue;
  try {
    return JSON.parse(stored) as T;
  } catch (e) {
    return defaultValue;
  }
};

const setToStorage = <T>(key: string, value: T): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
};

// Incomes
export const getIncomes = (): Income[] => getFromStorage<Income[]>(STORAGE_KEY_INCOMES, []);

export const saveIncome = (income: Income): void => {
  const incomes = getIncomes();
  const existing = incomes.findIndex((i) => i.id === income.id);
  if (existing >= 0) {
    incomes[existing] = income;
  } else {
    incomes.push(income);
  }
  setToStorage(STORAGE_KEY_INCOMES, incomes);
};

export const deleteIncome = (id: string): void => {
  const incomes = getIncomes().filter((i) => i.id !== id);
  setToStorage(STORAGE_KEY_INCOMES, incomes);
};

// Expenses
export const getExpenses = (): Expense[] => getFromStorage<Expense[]>(STORAGE_KEY_EXPENSES, []);

export const saveExpense = (expense: Expense): void => {
  const expenses = getExpenses();
  const existing = expenses.findIndex((e) => e.id === expense.id);
  if (existing >= 0) {
    expenses[existing] = expense;
  } else {
    expenses.push(expense);
  }
  setToStorage(STORAGE_KEY_EXPENSES, expenses);
};

export const deleteExpense = (id: string): void => {
  const expenses = getExpenses().filter((e) => e.id !== id);
  setToStorage(STORAGE_KEY_EXPENSES, expenses);
};

// Allocation
export const getAllocation = (): BudgetAllocation =>
  getFromStorage<BudgetAllocation>(STORAGE_KEY_ALLOCATION, defaultAllocation);

export const saveAllocation = (allocation: BudgetAllocation): void => {
  setToStorage(STORAGE_KEY_ALLOCATION, allocation);
};

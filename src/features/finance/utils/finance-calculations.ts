import type { Expense, Income, Transfer } from "../types";

export interface TransactionSummary {
  incomeTotal: number;
  expenseTotal: number;
  transferTotal: number;
  netTotal: number;
  itemCount: number;
  incomeCount: number;
  expenseCount: number;
  transferCount: number;
}

export function calculateTransactionSummary(
  incomes: Income[],
  expenses: Expense[],
  transfers: Transfer[]
): TransactionSummary {
  const incomeTotal = incomes.reduce((sum, item) => sum + item.amount, 0);
  const expenseTotal = expenses.reduce((sum, item) => sum + item.amount, 0);
  const transferTotal = transfers.reduce((sum, item) => sum + item.amount, 0);

  return {
    incomeTotal,
    expenseTotal,
    transferTotal,
    netTotal: incomeTotal - expenseTotal,
    itemCount: incomes.length + expenses.length + transfers.length,
    incomeCount: incomes.length,
    expenseCount: expenses.length,
    transferCount: transfers.length,
  };
}

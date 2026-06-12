export interface Income {
  id: string;
  date: string; // ISO string
  title: string;
  amount: number;
  source: string;
  usageDays: number;
  note?: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  date: string; // ISO string
  title: string;
  category: string;
  amount: number;
  note?: string;
  createdAt: string;
}

export interface BudgetAllocation {
  spendingPercentage: number;
  savingsPercentage: number;
  emergencyFundPercentage: number;
}

export interface FinanceSummary {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  savings: number;
  emergencyFund: number;
  dailyBudget: number;
}

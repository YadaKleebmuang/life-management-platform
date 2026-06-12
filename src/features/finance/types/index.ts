export interface Income {
  id: string;
  date: string; // ISO string
  title: string;
  amount: number;
  source: string; // legacy string
  accountId: string; // [NEW] Link to Account
  categoryId?: string; // [NEW] Link to dynamic category
  usageDays: number;
  note?: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  date: string; // ISO string
  title: string;
  category: string; // legacy string
  accountId: string; // [NEW] Link to Account
  categoryId?: string; // [NEW] Link to dynamic category
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

// ================= NEW FEATURES TYPES ================= //

export type AccountType = "Cash" | "Bank" | "E-Wallet" | "Savings" | "Other";

export interface Account {
  id: string;
  userId: string;
  accountName: string;
  accountType: AccountType;
  institutionName?: string;
  initialBalance: number;
  currentBalance: number;
  currency: string;
  note?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Transfer {
  id: string;
  userId: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  transferDate: string; // ISO string
  note?: string;
  createdAt: string;
}

export type DebtType = "borrowed" | "lent";
export type DebtStatus = "unpaid" | "partially_paid" | "paid";

export interface Debt {
  id: string;
  userId: string;
  debtType: DebtType;
  personName: string;
  amount: number;
  remainingAmount: number;
  relatedAccountId: string; // The account where the money was deposited (if borrowed) or withdrawn from (if lent)
  dueDate?: string; // ISO string
  status: DebtStatus;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DebtRepayment {
  id: string;
  userId: string;
  debtId: string;
  accountId: string; // The account used to repay (if borrowed) or where money is received (if lent)
  amount: number;
  repaymentDate: string; // ISO string
  note?: string;
  createdAt: string;
}

export type TransactionType =
  | "income"
  | "expense"
  | "transfer"
  | "debt_created"
  | "debt_repayment"
  | "goal_contribution"
  | "recurring_income"
  | "recurring_expense"
  | "manual_adjustment";

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  accountId: string; // Primary account affected
  relatedAccountId?: string; // e.g., destination account in transfer
  relatedDocumentId?: string; // e.g., incomeId, expenseId, transferId, debtId
  amount: number; // Positive means money in, negative means money out
  title: string;
  description?: string;
  transactionDate: string; // ISO string
  createdAt: string;
}

export interface AccountSnapshot {
  id: string;
  userId: string;
  accountId: string;
  accountName: string;
  balance: number;
  snapshotDate: string; // ISO string
  sourceType: TransactionType;
  sourceId: string; // ID of the transaction/event that caused this
  createdAt: string;
}

export type CategoryType = "income" | "expense";

export interface Category {
  id: string;
  userId: string;
  name: string;
  type: CategoryType;
  description?: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type GoalStatus = "active" | "completed" | "paused" | "cancelled";

export interface Goal {
  id: string;
  userId: string;
  goalName: string;
  targetAmount: number;
  currentAmount: number;
  linkedAccountId?: string; // Default account to contribute from
  startDate: string; // ISO string
  targetDate?: string; // ISO string
  status: GoalStatus;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GoalContribution {
  id: string;
  userId: string;
  goalId: string;
  accountId: string; // Account where money was withdrawn
  amount: number;
  contributionDate: string; // ISO string
  note?: string;
  createdAt: string;
}

export type RecurringFrequency = "daily" | "weekly" | "monthly" | "yearly";

export interface RecurringTransaction {
  id: string;
  userId: string;
  type: CategoryType; // "income" or "expense"
  title: string;
  amount: number;
  categoryId: string;
  accountId: string;
  frequency: RecurringFrequency;
  startDate: string; // ISO string
  endDate?: string; // ISO string
  nextRunDate: string; // ISO string
  lastRunDate?: string; // ISO string
  note?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

import { Income, Expense, BudgetAllocation, FinanceSummary } from "../types";

export function calculateSummary(
  incomes: Income[],
  expenses: Expense[],
  allocation: BudgetAllocation
): FinanceSummary {
  const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0);
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const balance = totalIncome - totalExpenses;

  const spendingMoney = (totalIncome * allocation.spendingPercentage) / 100;
  const savings = (totalIncome * allocation.savingsPercentage) / 100;
  const emergencyFund = (totalIncome * allocation.emergencyFundPercentage) / 100;

  // Calculate daily budget based on incomes that have usageDays
  // A simple way is to sum (income.amount * spendingPercentage / 100) / usageDays
  // Alternatively, just aggregate total spending money and divide by a standard month or the average usage days.
  // The requirement says: "Calculate daily budget from spending money divided by usage days"
  // For simplicity across multiple incomes, we'll calculate the weighted daily budget.
  let dailyBudget = 0;
  let totalSpendingPool = 0;
  let totalWeightedDays = 0;

  if (incomes.length > 0) {
      incomes.forEach((inc) => {
          const incSpending = (inc.amount * allocation.spendingPercentage) / 100;
          totalSpendingPool += incSpending;
          // weight by amount
          totalWeightedDays += inc.usageDays * inc.amount;
      });
      const avgDays = totalWeightedDays / totalIncome;
      dailyBudget = avgDays > 0 ? totalSpendingPool / avgDays : 0;
      
      // If we want a simpler method, we could just say:
      // sum( (income_amount * spend_pct) / usage_days )
      // Let's use the straightforward sum:
      dailyBudget = incomes.reduce((sum, inc) => {
        const incSpend = (inc.amount * allocation.spendingPercentage) / 100;
        return sum + (inc.usageDays > 0 ? incSpend / inc.usageDays : 0);
      }, 0);
  }

  return {
    totalIncome,
    totalExpenses,
    balance,
    savings,
    emergencyFund,
    dailyBudget,
  };
}

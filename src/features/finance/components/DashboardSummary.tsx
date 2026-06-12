"use client";

import { useAccounts } from "../hooks/useAccounts";
import { useDebts } from "../hooks/useDebts";
import { useGoals } from "../hooks/useGoals";
import { useTransactions } from "../hooks/useTransactions";
import { formatCurrency } from "../utils/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, Target, Scale, Activity } from "lucide-react";
import Link from "next/link";

export function DashboardSummary() {
  const { activeAccounts, loading: accountsLoading } = useAccounts();
  const { borrowedDebts, lentDebts, loading: debtsLoading } = useDebts();
  const { goals, loading: goalsLoading } = useGoals();
  const { transactions, loading: txLoading } = useTransactions();

  if (accountsLoading || debtsLoading || goalsLoading || txLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Calculate Net Worth
  const totalAssets = activeAccounts.reduce((sum, acc) => sum + acc.currentBalance, 0);
  const totalDebts = borrowedDebts.reduce((sum, d) => sum + d.remainingAmount, 0);
  const totalLent = lentDebts.reduce((sum, d) => sum + d.remainingAmount, 0);
  const netWorth = totalAssets + totalLent - totalDebts;

  // Recent Transactions (Limit to 5)
  const recentTx = transactions.slice(0, 5);

  // Active Goals (limit to 3)
  const activeGoals = goals.filter(g => g.status !== "completed").slice(0, 3);

  const getTxColor = (type: string) => {
    switch(type) {
      case "income": return "text-green-600";
      case "expense": return "text-red-600";
      case "transfer": return "text-blue-600";
      case "debt_created": return "text-purple-600";
      case "debt_repayment": return "text-teal-600";
      case "goal_contribution": return "text-indigo-600";
      default: return "text-gray-900";
    }
  };

  const getTxSign = (amount: number, type: string) => {
    if (amount > 0) return "+";
    if (amount < 0) return "-";
    return "";
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Net Worth */}
        <Card className="bg-gray-900 text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">
              ความมั่งคั่งสุทธิ (Net Worth)
            </CardTitle>
            <Wallet className="h-4 w-4 text-gray-300" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatCurrency(netWorth)}
            </div>
            <p className="text-xs text-gray-400 mt-1">สินทรัพย์ทั้งหมดลบหนี้สิน</p>
          </CardContent>
        </Card>

        {/* Total Assets (Accounts) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              เงินสดและเงินในบัญชี
            </CardTitle>
            <Wallet className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-gray-900">
              {formatCurrency(totalAssets)}
            </div>
            <Link href="/finance/accounts" className="text-xs text-blue-600 hover:underline mt-1 block">ดูบัญชีทั้งหมด</Link>
          </CardContent>
        </Card>

        {/* Total Debts (Borrowed) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              หนี้สินค้างชำระ
            </CardTitle>
            <Scale className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-red-600">
              {formatCurrency(totalDebts)}
            </div>
            <Link href="/finance/debts" className="text-xs text-blue-600 hover:underline mt-1 block">จัดการหนี้สิน</Link>
          </CardContent>
        </Card>

        {/* Total Lent (Lent) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              ลูกหนี้คงค้าง
            </CardTitle>
            <Scale className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-green-600">
              {formatCurrency(totalLent)}
            </div>
            <Link href="/finance/debts" className="text-xs text-blue-600 hover:underline mt-1 block">ดูรายละเอียด</Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Transactions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Activity className="h-5 w-5" /> ความเคลื่อนไหวล่าสุด
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentTx.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">ยังไม่มีความเคลื่อนไหว</p>
            ) : (
              <div className="space-y-4">
                {recentTx.map((tx) => (
                  <div key={tx.id} className="flex justify-between items-center border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium text-sm text-gray-900">{tx.title}</p>
                      <p className="text-xs text-gray-500">{new Date(tx.transactionDate).toLocaleDateString('th-TH')} • {tx.type}</p>
                    </div>
                    <div className={`font-semibold ${getTxColor(tx.type)}`}>
                      {getTxSign(tx.amount, tx.type)} {formatCurrency(Math.abs(tx.amount))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Goals Overview */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Target className="h-5 w-5" /> เป้าหมายการออมของคุณ
            </CardTitle>
            <Link href="/finance/goals" className="text-sm text-blue-600 hover:underline">ดูทั้งหมด</Link>
          </CardHeader>
          <CardContent>
            {activeGoals.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">คุณยังไม่มีเป้าหมายที่กำลังดำเนินการอยู่</p>
            ) : (
              <div className="space-y-5">
                {activeGoals.map((goal) => {
                  let progressPercent = (goal.currentAmount / goal.targetAmount) * 100;
                  if (progressPercent > 100) progressPercent = 100;

                  return (
                    <div key={goal.id}>
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-sm font-medium text-gray-900">{goal.goalName}</p>
                        <p className="text-xs font-semibold text-gray-700">{progressPercent.toFixed(1)}%</p>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2 mb-1 overflow-hidden">
                        <div 
                          className="bg-gray-900 h-2 rounded-full transition-all duration-500" 
                          style={{ width: `${progressPercent}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-[10px] text-gray-500">
                        <span>เก็บได้ {formatCurrency(goal.currentAmount)}</span>
                        <span>เป้าหมาย {formatCurrency(goal.targetAmount)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

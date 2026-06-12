"use client";

import { useFinanceData } from "../hooks/useFinanceData";
import { formatCurrency } from "../utils/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, TrendingUp, TrendingDown, PiggyBank, ShieldAlert, Calendar } from "lucide-react";

export function DashboardSummary() {
  const { summary } = useFinanceData();

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Total Balance */}
        <Card className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border-blue-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">
              ยอดเงินคงเหลือ
            </CardTitle>
            <Wallet className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {formatCurrency(summary.balance)}
            </div>
          </CardContent>
        </Card>

        {/* Total Income */}
        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-900/10 border-emerald-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">
              รายรับทั้งหมด
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-100">
              {formatCurrency(summary.totalIncome)}
            </div>
          </CardContent>
        </Card>

        {/* Total Expenses */}
        <Card className="bg-gradient-to-br from-red-500/10 to-red-900/10 border-red-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">
              รายจ่ายทั้งหมด
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-100">
              {formatCurrency(summary.totalExpenses)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Savings */}
        <Card className="bg-slate-900/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">
              เงินออม
            </CardTitle>
            <PiggyBank className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold text-slate-100">
              {formatCurrency(summary.savings)}
            </div>
          </CardContent>
        </Card>

        {/* Emergency Fund */}
        <Card className="bg-slate-900/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">
              เงินสำรองฉุกเฉิน
            </CardTitle>
            <ShieldAlert className="h-4 w-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold text-slate-100">
              {formatCurrency(summary.emergencyFund)}
            </div>
          </CardContent>
        </Card>

        {/* Daily Budget */}
        <Card className="bg-slate-900/50 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-blue-300">
              งบประมาณใช้จ่ายรายวัน
            </CardTitle>
            <Calendar className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-blue-100">
              {formatCurrency(summary.dailyBudget)}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

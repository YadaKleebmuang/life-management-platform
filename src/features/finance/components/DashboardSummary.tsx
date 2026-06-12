"use client";

import { useFinanceData } from "../hooks/useFinanceData";
import { formatCurrency } from "../utils/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, TrendingUp, TrendingDown, PiggyBank, ShieldAlert, Calendar } from "lucide-react";

export function DashboardSummary() {
  const { summary, loading } = useFinanceData();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Total Balance */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              ยอดเงินคงเหลือ
            </CardTitle>
            <Wallet className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {formatCurrency(summary.balance)}
            </div>
          </CardContent>
        </Card>

        {/* Total Income */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              รายรับทั้งหมด
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-gray-900">
              + {formatCurrency(summary.totalIncome)}
            </div>
          </CardContent>
        </Card>

        {/* Total Expenses */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              รายจ่ายทั้งหมด
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-gray-900">
              - {formatCurrency(summary.totalExpenses)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Savings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              เงินออม
            </CardTitle>
            <PiggyBank className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-medium text-gray-900">
              {formatCurrency(summary.savings)}
            </div>
          </CardContent>
        </Card>

        {/* Emergency Fund */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              เงินสำรองฉุกเฉิน
            </CardTitle>
            <ShieldAlert className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-medium text-gray-900">
              {formatCurrency(summary.emergencyFund)}
            </div>
          </CardContent>
        </Card>

        {/* Daily Budget */}
        <Card className="bg-gray-50 border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-gray-900">
              งบประมาณใช้จ่ายรายวัน
            </CardTitle>
            <Calendar className="h-4 w-4 text-gray-900" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-gray-900">
              {formatCurrency(summary.dailyBudget)}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

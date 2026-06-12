"use client";

import { useFinanceData } from "../hooks/useFinanceData";
import { formatCurrency, formatDateThai } from "../utils/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, parseISO } from "date-fns";

export function MonthlySummary() {
  const { incomes, expenses, allocation } = useFinanceData();

  // Group by month
  const monthlyData: Record<string, any> = {};

  incomes.forEach((inc) => {
    const monthKey = format(parseISO(inc.date), "yyyy-MM");
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        income: 0,
        expense: 0,
      };
    }
    monthlyData[monthKey].income += inc.amount;
  });

  expenses.forEach((exp) => {
    const monthKey = format(parseISO(exp.date), "yyyy-MM");
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        income: 0,
        expense: 0,
      };
    }
    monthlyData[monthKey].expense += exp.amount;
  });

  const sortedMonths = Object.keys(monthlyData).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>สรุปรายเดือน</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-400 uppercase bg-slate-900/50">
                <tr>
                  <th className="px-4 py-3 rounded-tl-lg">เดือน</th>
                  <th className="px-4 py-3 text-right">รายรับรวม</th>
                  <th className="px-4 py-3 text-right">รายจ่ายรวม</th>
                  <th className="px-4 py-3 text-right">คงเหลือ</th>
                  <th className="px-4 py-3 text-right">เงินออม (สะสม)</th>
                  <th className="px-4 py-3 rounded-tr-lg text-right">ฉุกเฉิน (สะสม)</th>
                </tr>
              </thead>
              <tbody>
                {sortedMonths.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      ยังไม่มีข้อมูล
                    </td>
                  </tr>
                ) : (
                  sortedMonths.map((month) => {
                    const data = monthlyData[month];
                    const balance = data.income - data.expense;
                    const savings = (data.income * allocation.savingsPercentage) / 100;
                    const emergency = (data.income * allocation.emergencyFundPercentage) / 100;

                    // Note: In a real app, savings and emergency might not just be a fixed cut of that month if there are expenses from it,
                    // but per requirement: "Summarize income, expenses, balance, savings, emergency fund by month",
                    // allocating percentage of that month's income to savings/emergency is standard budget planning.

                    return (
                      <tr key={month} className="border-b border-slate-800 hover:bg-slate-800/50">
                        <td className="px-4 py-3 text-slate-300 font-medium">
                          {formatDateThai(`${month}-01`).split(" ")[1]} {formatDateThai(`${month}-01`).split(" ")[2]}
                        </td>
                        <td className="px-4 py-3 text-right text-emerald-400">
                          {formatCurrency(data.income)}
                        </td>
                        <td className="px-4 py-3 text-right text-red-400">
                          {formatCurrency(data.expense)}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-slate-200">
                          {formatCurrency(balance)}
                        </td>
                        <td className="px-4 py-3 text-right text-purple-400">
                          {formatCurrency(savings)}
                        </td>
                        <td className="px-4 py-3 text-right text-amber-400">
                          {formatCurrency(emergency)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

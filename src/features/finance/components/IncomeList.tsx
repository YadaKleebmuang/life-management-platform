"use client";

import { useState } from "react";
import { useFinanceData } from "../hooks/useFinanceData";
import { formatCurrency, formatDateThai } from "../utils/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2 } from "lucide-react";

export function IncomeList() {
  const { incomes, addIncome, removeIncome } = useFinanceData();
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [source, setSource] = useState("");
  const [usageDays, setUsageDays] = useState("30");
  const [note, setNote] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount || !source) return;

    addIncome({
      date,
      title,
      amount: parseFloat(amount),
      source,
      usageDays: parseInt(usageDays, 10),
      note,
    });

    setTitle("");
    setAmount("");
    setSource("");
    setNote("");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>เพิ่มรายรับ</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">วันที่</label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">ชื่อรายการ</label>
              <Input placeholder="เช่น เงินเดือน" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">จำนวนเงิน (บาท)</label>
              <Input type="number" min="0" step="0.01" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">แหล่งที่มา</label>
              <Input placeholder="เช่น บริษัท A" value={source} onChange={(e) => setSource(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">จำนวนวันที่จะใช้</label>
              <Input type="number" min="1" value={usageDays} onChange={(e) => setUsageDays(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">หมายเหตุ</label>
              <Input placeholder="เพิ่มเติม..." value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
            <div className="md:col-span-2 flex justify-end mt-2">
              <Button type="submit">บันทึกรายรับ</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>ประวัติรายรับ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-400 uppercase bg-slate-900/50">
                <tr>
                  <th className="px-4 py-3 rounded-tl-lg">วันที่</th>
                  <th className="px-4 py-3">รายการ</th>
                  <th className="px-4 py-3">แหล่งที่มา</th>
                  <th className="px-4 py-3 text-right">จำนวนเงิน</th>
                  <th className="px-4 py-3 rounded-tr-lg text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {incomes.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                      ยังไม่มีข้อมูลรายรับ
                    </td>
                  </tr>
                ) : (
                  incomes.map((income) => (
                    <tr key={income.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                      <td className="px-4 py-3 text-slate-300">{formatDateThai(income.date)}</td>
                      <td className="px-4 py-3 font-medium text-slate-200">
                        {income.title}
                        {income.note && <div className="text-xs text-slate-500 font-normal mt-0.5">{income.note}</div>}
                      </td>
                      <td className="px-4 py-3 text-slate-400">{income.source}</td>
                      <td className="px-4 py-3 text-right text-emerald-400 font-medium">
                        +{formatCurrency(income.amount)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button variant="ghost" size="icon" onClick={() => removeIncome(income.id)}>
                          <Trash2 className="h-4 w-4 text-red-400" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

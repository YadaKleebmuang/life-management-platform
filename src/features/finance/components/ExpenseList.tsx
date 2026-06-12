"use client";

import { useState } from "react";
import { useFinanceData } from "../hooks/useFinanceData";
import { formatCurrency, formatDateThai } from "../utils/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2 } from "lucide-react";

export function ExpenseList() {
  const { expenses, addExpense, removeExpense } = useFinanceData();
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("อาหาร");
  const [note, setNote] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount || !category) return;

    addExpense({
      date,
      title,
      amount: parseFloat(amount),
      category,
      note,
    });

    setTitle("");
    setAmount("");
    setNote("");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>เพิ่มรายจ่าย</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">วันที่</label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">ชื่อรายการ</label>
              <Input placeholder="เช่น ข้าวกลางวัน" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">จำนวนเงิน (บาท)</label>
              <Input type="number" min="0" step="0.01" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">หมวดหมู่</label>
              <select
                className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-900/50 px-3 py-2 text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="อาหาร">อาหาร</option>
                <option value="เดินทาง">เดินทาง</option>
                <option value="ช้อปปิ้ง">ช้อปปิ้ง</option>
                <option value="บันเทิง">บันเทิง</option>
                <option value="สาธารณูปโภค">สาธารณูปโภค</option>
                <option value="อื่นๆ">อื่นๆ</option>
              </select>
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-medium text-slate-300">หมายเหตุ</label>
              <Input placeholder="เพิ่มเติม..." value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
            <div className="md:col-span-2 flex justify-end mt-2">
              <Button type="submit" variant="danger" className="text-white">บันทึกรายจ่าย</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>ประวัติรายจ่าย</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-400 uppercase bg-slate-900/50">
                <tr>
                  <th className="px-4 py-3 rounded-tl-lg">วันที่</th>
                  <th className="px-4 py-3">รายการ</th>
                  <th className="px-4 py-3">หมวดหมู่</th>
                  <th className="px-4 py-3 text-right">จำนวนเงิน</th>
                  <th className="px-4 py-3 rounded-tr-lg text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                      ยังไม่มีข้อมูลรายจ่าย
                    </td>
                  </tr>
                ) : (
                  expenses.map((expense) => (
                    <tr key={expense.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                      <td className="px-4 py-3 text-slate-300">{formatDateThai(expense.date)}</td>
                      <td className="px-4 py-3 font-medium text-slate-200">
                        {expense.title}
                        {expense.note && <div className="text-xs text-slate-500 font-normal mt-0.5">{expense.note}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-slate-800 text-slate-300 rounded-full text-xs">
                          {expense.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-red-400 font-medium">
                        -{formatCurrency(expense.amount)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button variant="ghost" size="icon" onClick={() => removeExpense(expense.id)}>
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

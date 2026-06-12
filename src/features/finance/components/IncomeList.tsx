"use client";

import { useState } from "react";
import { useFinanceData } from "../hooks/useFinanceData";
import { formatCurrency, formatDateThai } from "../utils/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Edit2 } from "lucide-react";

export function IncomeList() {
  const { incomes, addIncome, removeIncome, updateIncome } = useFinanceData();
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [source, setSource] = useState("");
  const [usageDays, setUsageDays] = useState("30");
  const [note, setNote] = useState("");
  const [success, setSuccess] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount || !source) return;

    if (editingId) {
      const existingIncome = incomes.find(i => i.id === editingId);
      if (existingIncome) {
        updateIncome({
          ...existingIncome,
          date,
          title,
          amount: parseFloat(amount),
          source,
          usageDays: parseInt(usageDays, 10),
          note,
        });
      }
      setEditingId(null);
    } else {
      addIncome({
        date,
        title,
        amount: parseFloat(amount),
        source,
        usageDays: parseInt(usageDays, 10),
        note,
      });
    }

    resetForm();
    setSuccess(true);
    
    setTimeout(() => {
      setSuccess(false);
    }, 3000);
  };

  const handleEdit = (income: any) => {
    setEditingId(income.id);
    setDate(income.date);
    setTitle(income.title);
    setAmount(income.amount.toString());
    setSource(income.source);
    setUsageDays(income.usageDays.toString());
    setNote(income.note || "");
  };

  const resetForm = () => {
    setEditingId(null);
    setDate(new Date().toISOString().split("T")[0]);
    setTitle("");
    setAmount("");
    setSource("");
    setUsageDays("30");
    setNote("");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "แก้ไขรายรับ" : "เพิ่มรายรับ"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">วันที่</label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">ชื่อรายการ</label>
              <Input placeholder="เช่น เงินเดือน" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">จำนวนเงิน (บาท)</label>
              <Input type="number" min="0" step="0.01" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">แหล่งที่มา</label>
              <Input placeholder="เช่น บริษัท A" value={source} onChange={(e) => setSource(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">จำนวนวันที่จะใช้</label>
              <Input type="number" min="1" value={usageDays} onChange={(e) => setUsageDays(e.target.value)} required />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-medium text-gray-700">หมายเหตุ</label>
              <Input placeholder="เพิ่มเติม..." value={note} onChange={(e) => setNote(e.target.value)} />
            </div>

            {success && <div className="md:col-span-2 text-gray-900 bg-gray-100 p-3 rounded-lg border border-gray-200 text-sm font-medium flex items-center">
              <svg className="w-4 h-4 mr-2 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              ข้อมูลบันทึกแล้ว
            </div>}

            <div className="md:col-span-2 flex justify-end gap-2 mt-4">
              {editingId && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  ยกเลิก
                </Button>
              )}
              <Button type="submit">{editingId ? "บันทึกการแก้ไข" : "บันทึกรายรับ"}</Button>
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
              <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-y border-gray-200">
                <tr>
                  <th className="px-4 py-3 font-semibold">วันที่</th>
                  <th className="px-4 py-3 font-semibold">รายการ</th>
                  <th className="px-4 py-3 font-semibold">แหล่งที่มา</th>
                  <th className="px-4 py-3 font-semibold text-right">จำนวนเงิน</th>
                  <th className="px-4 py-3 font-semibold text-center w-16">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {incomes.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      ยังไม่มีข้อมูลรายรับ
                    </td>
                  </tr>
                ) : (
                  incomes.map((income) => (
                    <tr key={income.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-600">{formatDateThai(income.date)}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {income.title}
                        {income.note && <div className="text-xs text-gray-500 font-normal mt-0.5">{income.note}</div>}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{income.source}</td>
                      <td className="px-4 py-3 text-right text-gray-900 font-medium">
                        + {formatCurrency(income.amount)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(income)}>
                            <Edit2 className="h-4 w-4 text-gray-400 hover:text-gray-900 transition-colors" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => removeIncome(income.id)}>
                            <Trash2 className="h-4 w-4 text-gray-400 hover:text-gray-900 transition-colors" />
                          </Button>
                        </div>
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

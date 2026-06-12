"use client";

import { useState } from "react";
import { useFinanceData } from "../hooks/useFinanceData";
import { formatCurrency, formatDateThai } from "../utils/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Edit2 } from "lucide-react";

export function ExpenseList() {
  const { expenses, addExpense, removeExpense, updateExpense, loading } = useFinanceData();
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("อาหาร");
  const [note, setNote] = useState("");
  const [success, setSuccess] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount || !category) return;

    setSaving(true);
    try {
      if (editingId) {
        const existingExpense = expenses.find(exp => exp.id === editingId);
        if (existingExpense) {
          await updateExpense({
            ...existingExpense,
            date,
            title,
            amount: parseFloat(amount),
            category,
            note,
          });
        }
        setEditingId(null);
      } else {
        await addExpense({
          date,
          title,
          amount: parseFloat(amount),
          category,
          note,
        });
      }

      resetForm();
      setSuccess(true);
      
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (error) {
      console.error("Error saving expense:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (expense: any) => {
    setEditingId(expense.id);
    setDate(expense.date);
    setTitle(expense.title);
    setAmount(expense.amount.toString());
    setCategory(expense.category);
    setNote(expense.note || "");
  };

  const resetForm = () => {
    setEditingId(null);
    setDate(new Date().toISOString().split("T")[0]);
    setTitle("");
    setAmount("");
    setCategory("อาหาร");
    setNote("");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "แก้ไขรายจ่าย" : "เพิ่มรายจ่าย"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">วันที่</label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">ชื่อรายการ</label>
              <Input placeholder="เช่น ข้าวกลางวัน" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">จำนวนเงิน (บาท)</label>
              <Input type="number" min="0" step="0.01" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">หมวดหมู่</label>
              <select
                className="flex h-10 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 shadow-sm"
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
              <label className="text-sm font-medium text-gray-700">หมายเหตุ</label>
              <Input placeholder="เพิ่มเติม..." value={note} onChange={(e) => setNote(e.target.value)} />
            </div>

            {success && <div className="md:col-span-2 text-gray-900 bg-gray-100 p-3 rounded-lg border border-gray-200 text-sm font-medium flex items-center">
              <svg className="w-4 h-4 mr-2 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              ข้อมูลบันทึกแล้ว
            </div>}

            <div className="md:col-span-2 flex justify-end gap-2 mt-4">
              {editingId && (
                <Button type="button" variant="outline" onClick={resetForm} disabled={saving}>
                  ยกเลิก
                </Button>
              )}
              <Button type="submit" disabled={saving}>
                {saving ? "กำลังบันทึก..." : (editingId ? "บันทึกการแก้ไข" : "บันทึกรายจ่าย")}
              </Button>
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
              <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-y border-gray-200">
                <tr>
                  <th className="px-4 py-3 font-semibold">วันที่</th>
                  <th className="px-4 py-3 font-semibold">รายการ</th>
                  <th className="px-4 py-3 font-semibold">หมวดหมู่</th>
                  <th className="px-4 py-3 font-semibold text-right">จำนวนเงิน</th>
                  <th className="px-4 py-3 font-semibold text-center w-16">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      กำลังโหลดข้อมูล...
                    </td>
                  </tr>
                ) : expenses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      ยังไม่มีข้อมูลรายจ่าย
                    </td>
                  </tr>
                ) : (
                  expenses.map((expense) => (
                    <tr key={expense.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-600">{formatDateThai(expense.date)}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {expense.title}
                        {expense.note && <div className="text-xs text-gray-500 font-normal mt-0.5">{expense.note}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium border border-gray-200">
                          {expense.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-900 font-medium">
                        - {formatCurrency(expense.amount)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(expense)}>
                            <Edit2 className="h-4 w-4 text-gray-400 hover:text-gray-900 transition-colors" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => removeExpense(expense.id)}>
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

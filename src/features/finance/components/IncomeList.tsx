"use client";

import { useState } from "react";
import { useFinanceData } from "../hooks/useFinanceData";
import { useAccounts } from "../hooks/useAccounts";
import { useCategories } from "../hooks/useCategories";
import { formatCurrency, formatDateThai } from "../utils/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Edit2 } from "lucide-react";

export function IncomeList() {
  const { incomes, addIncome, removeIncome, updateIncome, loading: financeLoading } = useFinanceData();
  const { activeAccounts, loading: accountsLoading } = useAccounts();
  const { activeIncomeCategories, loading: categoriesLoading } = useCategories();
  
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [source, setSource] = useState(""); // Legacy field backward compatibility
  const [usageDays, setUsageDays] = useState("30");
  const [note, setNote] = useState("");
  const [success, setSuccess] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount || !accountId) return;

    setSaving(true);
    try {
      if (editingId) {
        const existingIncome = incomes.find(i => i.id === editingId);
        if (existingIncome) {
          await updateIncome({
            ...existingIncome,
            date,
            title,
            amount: parseFloat(amount),
            source: source || "Other",
            accountId: existingIncome.accountId,
            categoryId,
            usageDays: parseInt(usageDays, 10),
            note,
          });
        }
        setEditingId(null);
      } else {
        await addIncome({
          date,
          title,
          amount: parseFloat(amount),
          source: source || "Other",
          accountId,
          categoryId,
          usageDays: parseInt(usageDays, 10),
          note,
        });
      }

      resetForm();
      setSuccess(true);
      
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (error) {
      console.error("Error saving income:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (income: any) => {
    setEditingId(income.id);
    setDate(income.date);
    setTitle(income.title);
    setAmount(income.amount.toString());
    setAccountId(income.accountId || "");
    setCategoryId(income.categoryId || "");
    setSource(income.source || "");
    setUsageDays(income.usageDays?.toString() || "30");
    setNote(income.note || "");
  };

  const resetForm = () => {
    setEditingId(null);
    setDate(new Date().toISOString().split("T")[0]);
    setTitle("");
    setAmount("");
    setAccountId("");
    setCategoryId("");
    setSource("");
    setUsageDays("30");
    setNote("");
  };

  const getCategoryName = (catId?: string, fallbackSource?: string) => {
    if (!catId) return fallbackSource || "-";
    const cat = activeIncomeCategories.find(c => c.id === catId);
    return cat ? cat.name : (fallbackSource || "-");
  };

  const getAccountName = (accId?: string) => {
    if (!accId) return "-";
    const acc = activeAccounts.find(a => a.id === accId);
    return acc ? acc.accountName : "ไม่ระบุบัญชี";
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
              <label className="text-sm font-medium text-gray-700">บัญชีรับเงิน *</label>
              <select
                className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                required
                disabled={!!editingId}
              >
                <option value="" disabled>เลือกบัญชี</option>
                {activeAccounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.accountName}</option>
                ))}
              </select>
              {editingId && <p className="text-xs text-gray-500">ไม่สามารถเปลี่ยนบัญชีได้ หากต้องการเปลี่ยนให้ลบแล้วเพิ่มใหม่</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">หมวดหมู่</label>
              <select
                className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">เลือกหมวดหมู่...</option>
                {activeIncomeCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
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
                <Button type="button" variant="outline" onClick={resetForm} disabled={saving}>
                  ยกเลิก
                </Button>
              )}
              <Button type="submit" disabled={saving}>
                {saving ? "กำลังบันทึก..." : (editingId ? "บันทึกการแก้ไข" : "บันทึกรายรับ")}
              </Button>
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
                  <th className="px-4 py-3 font-semibold hidden md:table-cell">หมวดหมู่</th>
                  <th className="px-4 py-3 font-semibold">บัญชี</th>
                  <th className="px-4 py-3 font-semibold text-right">จำนวนเงิน</th>
                  <th className="px-4 py-3 font-semibold text-center w-16">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {financeLoading || accountsLoading || categoriesLoading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      กำลังโหลดข้อมูล...
                    </td>
                  </tr>
                ) : incomes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      ยังไม่มีข้อมูลรายรับ
                    </td>
                  </tr>
                ) : (
                  incomes.map((income) => (
                    <tr key={income.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-900">{new Date(income.date).toLocaleDateString("th-TH")}</td>
                      <td className="px-4 py-3 text-gray-900">
                        {income.title}
                        <div className="text-xs text-gray-500 block md:hidden">{getCategoryName(income.categoryId, income.source)}</div>
                        {income.note && <div className="text-xs text-gray-400 mt-0.5 break-all line-clamp-1">{income.note}</div>}
                      </td>
                      <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{getCategoryName(income.categoryId, income.source)}</td>
                      <td className="px-4 py-3 text-gray-500">{getAccountName(income.accountId)}</td>
                      <td className="px-4 py-3 text-right text-gray-900 font-medium">
                        + {formatCurrency(income.amount)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(income)}>
                            <Edit2 className="h-4 w-4 text-gray-400 hover:text-gray-900 transition-colors" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => removeIncome(income)}>
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

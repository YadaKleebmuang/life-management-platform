"use client";

import { useState, useEffect } from "react";
import { useRecurringTransactions } from "../hooks/useRecurringTransactions";
import { useAccounts } from "../hooks/useAccounts";
import { useCategories } from "../hooks/useCategories";
import { formatCurrency } from "../utils/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RecurringFrequency, CategoryType } from "../types";
import { Repeat, Plus, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";

export function RecurringTransactionList() {
  const { 
    recurringTransactions, 
    loading: txLoading, 
    addTransaction, 
    toggleStatus, 
    removeTransaction,
    triggerAutomation
  } = useRecurringTransactions();
  const { activeAccounts, loading: accountsLoading } = useAccounts();
  const { activeIncomeCategories, activeExpenseCategories, loading: categoriesLoading } = useCategories();
  
  const [showAddForm, setShowAddForm] = useState(false);

  // Form State
  const [type, setType] = useState<CategoryType>("expense");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [frequency, setFrequency] = useState<RecurringFrequency>("monthly");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState("");
  const [note, setNote] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Trigger automation on load to process any due transactions
  useEffect(() => {
    triggerAutomation();
  }, [triggerAutomation]);

  const activeCategories = type === "income" 
    ? activeIncomeCategories
    : activeExpenseCategories;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount || !categoryId || !accountId) return;

    const txAmount = parseFloat(amount);
    if (txAmount <= 0) {
      setError("จำนวนเงินต้องมากกว่า 0");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await addTransaction({
        type,
        title,
        amount: txAmount,
        categoryId,
        accountId,
        frequency,
        startDate,
        endDate: endDate || undefined,
        note,
      });

      resetForm();
      setShowAddForm(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      
      // Check if the newly added transaction needs to run immediately
      triggerAutomation();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "เกิดข้อผิดพลาด");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setType("expense");
    setTitle("");
    setAmount("");
    setCategoryId("");
    setAccountId("");
    setFrequency("monthly");
    setStartDate(new Date().toISOString().split("T")[0]);
    setEndDate("");
    setNote("");
  };

  const getAccountName = (accId: string) => {
    return activeAccounts.find(a => a.id === accId)?.accountName || "-";
  };

  const getCategoryName = (catId: string, type: "income" | "expense") => {
    const cats = type === "income" ? activeIncomeCategories : activeExpenseCategories;
    return cats.find(c => c.id === catId)?.name || "-";
  };

  const getFrequencyLabel = (freq: string) => {
    switch(freq) {
      case "daily": return "ทุกวัน";
      case "weekly": return "ทุกสัปดาห์";
      case "monthly": return "ทุกเดือน";
      case "yearly": return "ทุกปี";
      default: return freq;
    }
  };

  if (txLoading || accountsLoading || categoriesLoading) {
    return (
      <div className="flex justify-center p-12">
        <div className="w-8 h-8 border-4 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">รายการประจำทั้งหมด ({recurringTransactions.length})</h2>
        {!showAddForm && (
          <Button onClick={() => { setShowAddForm(true); setError(""); }} className="flex items-center gap-2" size="sm">
            <Plus className="h-4 w-4" /> สร้างรายการ
          </Button>
        )}
      </div>

      {success && <div className="text-gray-900 bg-gray-100 p-3 rounded-lg border border-gray-200 text-sm font-medium flex items-center">
        <svg className="w-4 h-4 mr-2 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        บันทึกข้อมูลเรียบร้อยแล้ว ระบบจะทำรายการให้อัตโนมัติตามเวลาที่กำหนด
      </div>}

      {showAddForm && (
        <Card className="border-gray-900 shadow-sm">
          <CardHeader>
            <CardTitle>สร้างรายการที่เกิดประจำ (Recurring)</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-gray-700 block">ประเภทรายการ</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="txType" checked={type === "expense"} onChange={() => setType("expense")} />
                    <span className="text-sm">รายจ่าย</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="txType" checked={type === "income"} onChange={() => setType("income")} />
                    <span className="text-sm">รายรับ</span>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">ชื่อรายการ *</label>
                <Input type="text" placeholder="เช่น ค่าเช่าห้อง, เงินเดือน" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">จำนวนเงิน (บาท) *</label>
                <Input type="number" min="0" step="0.01" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} required />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">หมวดหมู่ *</label>
                <select
                  className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  required
                >
                  <option value="" disabled>เลือกหมวดหมู่</option>
                  {activeCategories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">บัญชี *</label>
                <select
                  className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  required
                >
                  <option value="" disabled>เลือกบัญชี</option>
                  {activeAccounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.accountName}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">ความถี่ *</label>
                <select
                  className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as RecurringFrequency)}
                  required
                >
                  <option value="daily">ทุกวัน (Daily)</option>
                  <option value="weekly">ทุกสัปดาห์ (Weekly)</option>
                  <option value="monthly">ทุกเดือน (Monthly)</option>
                  <option value="yearly">ทุกปี (Yearly)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">วันที่เริ่มทำรายการ *</label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">สิ้นสุด (ไม่บังคับ)</label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                <p className="text-[10px] text-gray-500">หากไม่ใส่ ระบบจะทำรายการไปเรื่อยๆ จนกว่าคุณจะปิดใช้งาน</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">หมายเหตุ (ไม่บังคับ)</label>
                <Input type="text" placeholder="รายละเอียด..." value={note} onChange={(e) => setNote(e.target.value)} />
              </div>

              {error && (
                <div className="md:col-span-2 text-red-600 bg-red-50 p-3 rounded-lg border border-red-200 text-sm font-medium">
                  {error}
                </div>
              )}

              <div className="md:col-span-2 flex justify-end gap-2 mt-4">
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)} disabled={saving}>
                  ยกเลิก
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "กำลังบันทึก..." : "บันทึกและเปิดใช้งาน"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {recurringTransactions.length === 0 && !showAddForm ? (
        <div className="p-12 text-center border-2 border-dashed border-gray-200 rounded-lg">
          <p className="text-gray-500 mb-4">ยังไม่มีการตั้งค่ารายการประจำ</p>
          <Button onClick={() => { setShowAddForm(true); setError(""); }} variant="outline">
            สร้างรายการแรก
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {recurringTransactions.map(tx => (
            <Card key={tx.id} className={`overflow-hidden transition-all ${!tx.isActive ? 'opacity-60 bg-gray-50' : 'hover:border-gray-400'}`}>
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${tx.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      <Repeat className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">
                        {tx.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        หมวด: {getCategoryName(tx.categoryId, tx.type)} | บัญชี: {getAccountName(tx.accountId)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.type === 'income' ? '+' : '-'} {formatCurrency(tx.amount)}
                    </p>
                    <p className="text-[10px] text-gray-500 uppercase font-medium">{getFrequencyLabel(tx.frequency)}</p>
                  </div>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-xs flex justify-between mb-4">
                  <div>
                    <p className="text-gray-500 mb-0.5">ทำรายการครั้งถัดไป:</p>
                    <p className="font-medium text-gray-900">{new Date(tx.nextRunDate).toLocaleDateString('th-TH')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-500 mb-0.5">ทำรายการล่าสุด:</p>
                    <p className="font-medium text-gray-900">{tx.lastRunDate ? new Date(tx.lastRunDate).toLocaleDateString('th-TH') : '-'}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button 
                    onClick={() => toggleStatus(tx)}
                    className={`flex items-center gap-2 text-sm font-medium transition-colors ${tx.isActive ? 'text-green-600 hover:text-green-700' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    {tx.isActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                    {tx.isActive ? "กำลังทำงาน" : "ปิดใช้งานอยู่"}
                  </button>

                  <button 
                    onClick={() => {
                      if(confirm("คุณต้องการลบรายการประจำนี้ใช่หรือไม่? (ประวัติธุรกรรมที่เคยเกิดขึ้นจะไม่ถูกลบ)")) {
                        removeTransaction(tx.id);
                      }
                    }}
                    className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

    </div>
  );
}

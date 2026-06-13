"use client";

import { useState } from "react";
import { useDebts } from "../hooks/useDebts";
import { useAccounts } from "../hooks/useAccounts";
import { formatCurrency } from "../utils/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DebtType, Debt } from "../types";
import { HandCoins, UserMinus, Plus } from "lucide-react";

export function DebtList() {
  const { borrowedDebts, lentDebts, loading: debtsLoading, addDebt, addRepayment } = useDebts();
  const { activeAccounts, loading: accountsLoading } = useAccounts();
  
  const [activeTab, setActiveTab] = useState<DebtType>("borrowed");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showRepayFormId, setShowRepayFormId] = useState<string | null>(null);

  // Add Debt Form State
  const [personName, setPersonName] = useState("");
  const [amount, setAmount] = useState("");
  const [relatedAccountId, setRelatedAccountId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [note, setNote] = useState("");
  
  // Repay Debt Form State
  const [repayAmount, setRepayAmount] = useState("");
  const [repayAccountId, setRepayAccountId] = useState("");
  const [repayDate, setRepayDate] = useState(new Date().toISOString().split("T")[0]);
  const [repayNote, setRepayNote] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleAddDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personName || !amount || !relatedAccountId) return;

    const debtAmount = parseFloat(amount);
    if (debtAmount <= 0) {
      setError("จำนวนเงินต้องมากกว่า 0");
      return;
    }

    // Quick validation for Lent (ensure enough money to lend)
    if (activeTab === "lent") {
      const acc = activeAccounts.find(a => a.id === relatedAccountId);
      if (acc && acc.currentBalance < debtAmount) {
        setError("ยอดเงินในบัญชีต้นทางไม่พอให้ยืม");
        return;
      }
    }

    setSaving(true);
    setError("");
    try {
      await addDebt({
        debtType: activeTab,
        personName,
        amount: debtAmount,
        relatedAccountId,
        dueDate: dueDate || undefined,
        note,
      });

      setPersonName("");
      setAmount("");
      setRelatedAccountId("");
      setDueDate("");
      setNote("");
      setShowAddForm(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "เกิดข้อผิดพลาด");
    } finally {
      setSaving(false);
    }
  };

  const handleRepayDebt = async (e: React.FormEvent, debt: Debt) => {
    e.preventDefault();
    if (!repayAmount || !repayAccountId) return;

    const amount = parseFloat(repayAmount);
    if (amount <= 0 || amount > debt.remainingAmount) {
      setError("จำนวนเงินไม่ถูกต้อง หรือมากกว่าหนี้คงเหลือ");
      return;
    }

    // Validation for Borrowed (ensure enough money to repay)
    if (debt.debtType === "borrowed") {
      const acc = activeAccounts.find(a => a.id === repayAccountId);
      if (acc && acc.currentBalance < amount) {
        setError("ยอดเงินในบัญชีไม่พอสำหรับชำระหนี้");
        return;
      }
    }

    setSaving(true);
    setError("");
    try {
      await addRepayment({
        debtId: debt.id,
        accountId: repayAccountId,
        amount,
        repaymentDate: repayDate,
        note: repayNote,
      });

      setRepayAmount("");
      setRepayAccountId("");
      setRepayNote("");
      setRepayDate(new Date().toISOString().split("T")[0]);
      setShowRepayFormId(null);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "เกิดข้อผิดพลาด");
    } finally {
      setSaving(false);
    }
  };

  const currentDebts = activeTab === "borrowed" ? borrowedDebts : lentDebts;

  const renderDebtCard = (debt: Debt) => {
    const isPaid = debt.status === "paid";
    const isRepaying = showRepayFormId === debt.id;
    const progressPercent = ((debt.amount - debt.remainingAmount) / debt.amount) * 100;

    return (
      <Card key={debt.id} className={`overflow-hidden transition-all ${isPaid ? 'opacity-70 bg-gray-50' : 'hover:border-gray-400'}`}>
        <CardContent className="p-5">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{debt.personName}</h3>
              {debt.dueDate && <p className="text-xs text-gray-500">กำหนดชำระ: {new Date(debt.dueDate).toLocaleDateString("th-TH")}</p>}
              {debt.note && <p className="text-xs text-gray-500 mt-1 italic break-words line-clamp-2">หมายเหตุ: {debt.note}</p>}
            </div>
            <div className={`px-2.5 py-1 rounded-full text-xs font-medium ${
              isPaid ? "bg-green-100 text-green-800" : 
              debt.status === "partially_paid" ? "bg-blue-100 text-blue-800" : 
              "bg-gray-100 text-gray-800"
            }`}>
              {isPaid ? "คืนครบแล้ว" : debt.status === "partially_paid" ? "ชำระบางส่วน" : "ยังไม่ได้ชำระ"}
            </div>
          </div>

          <div className="flex justify-between items-end mb-2">
            <div>
              <p className="text-xs text-gray-500 mb-1">ยอดจัดตั้ง (ทั้งหมด)</p>
              <p className="text-sm font-medium text-gray-900">{formatCurrency(debt.amount)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 mb-1">ยอดคงเหลือ</p>
              <p className={`text-xl font-bold ${isPaid ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(debt.remainingAmount)}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-1.5 mb-4 overflow-hidden">
            <div className="bg-gray-900 h-1.5 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
          </div>

          {!isPaid && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              {!isRepaying ? (
                <Button variant="outline" className="w-full" onClick={() => {
                  setShowRepayFormId(debt.id);
                  setError("");
                }}>
                  {activeTab === "borrowed" ? "ชำระเงิน" : "รับเงินคืน"}
                </Button>
              ) : (
                <form onSubmit={(e) => handleRepayDebt(e, debt)} className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">
                    {activeTab === "borrowed" ? "บันทึกการชำระเงิน" : "บันทึกการรับเงินคืน"}
                  </h4>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-700">วันที่ทำรายการ *</label>
                    <Input type="date" className="h-8 text-sm" value={repayDate} onChange={(e) => setRepayDate(e.target.value)} required />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-700">จำนวนเงิน (บาท) *</label>
                    <Input type="number" min="0" step="0.01" max={debt.remainingAmount} className="h-8 text-sm" placeholder="0.00" value={repayAmount} onChange={(e) => setRepayAmount(e.target.value)} required />
                    <p className="text-[10px] text-gray-500">สูงสุด: {formatCurrency(debt.remainingAmount)}</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-700">
                      {activeTab === "borrowed" ? "จ่ายจากบัญชี *" : "รับเงินเข้าบัญชี *"}
                    </label>
                    <select
                      className="flex h-8 w-full rounded-md border border-gray-200 bg-white px-2 py-1 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2"
                      value={repayAccountId}
                      onChange={(e) => setRepayAccountId(e.target.value)}
                      required
                    >
                      <option value="" disabled>เลือกบัญชี</option>
                      {activeAccounts.map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.accountName}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-700">หมายเหตุ</label>
                    <Input type="text" className="h-8 text-sm" placeholder="รายละเอียด..." value={repayNote} onChange={(e) => setRepayNote(e.target.value)} />
                  </div>

                  {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

                  <div className="flex gap-2 pt-2">
                    <Button type="button" variant="ghost" size="sm" className="flex-1 text-xs" onClick={() => setShowRepayFormId(null)} disabled={saving}>
                      ยกเลิก
                    </Button>
                    <Button type="submit" size="sm" className="flex-1 text-xs" disabled={saving}>
                      {saving ? "กำลังบันทึก..." : "ยืนยัน"}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (debtsLoading || accountsLoading) {
    return (
      <div className="flex justify-center p-12">
        <div className="w-8 h-8 border-4 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Tabs */}
      <div className="flex p-1 bg-gray-100 rounded-lg w-full max-w-md mx-auto md:mx-0">
        <button
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
            activeTab === "borrowed" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => { setActiveTab("borrowed"); setShowAddForm(false); }}
        >
          <UserMinus className="w-4 h-4 inline-block mr-2 mb-0.5" />
          หนี้สินของฉัน
        </button>
        <button
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
            activeTab === "lent" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => { setActiveTab("lent"); setShowAddForm(false); }}
        >
          <HandCoins className="w-4 h-4 inline-block mr-2 mb-0.5" />
          ลูกหนี้ของฉัน
        </button>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">
          {activeTab === "borrowed" ? "หนี้สินที่ต้องชำระ" : "เงินที่ให้คนอื่นยืม"}
        </h2>
        {!showAddForm && (
          <Button onClick={() => { setShowAddForm(true); setError(""); }} className="flex items-center gap-2" size="sm">
            <Plus className="h-4 w-4" /> 
            {activeTab === "borrowed" ? "เพิ่มหนี้สิน" : "เพิ่มลูกหนี้"}
          </Button>
        )}
      </div>

      {success && <div className="text-gray-900 bg-gray-100 p-3 rounded-lg border border-gray-200 text-sm font-medium flex items-center">
        <svg className="w-4 h-4 mr-2 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        บันทึกข้อมูลเรียบร้อยแล้ว
      </div>}

      {showAddForm && (
        <Card className="border-gray-900 shadow-sm">
          <CardHeader>
            <CardTitle>{activeTab === "borrowed" ? "เพิ่มรายการหนี้สินใหม่" : "เพิ่มรายการลูกหนี้ใหม่"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddDebt} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">ชื่อผู้ให้ยืม / ผู้ยืม *</label>
                <Input
                  type="text"
                  placeholder="เช่น สมชาย, ธนาคาร A"
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">จำนวนเงิน (บาท) *</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  {activeTab === "borrowed" ? "เงินเข้าบัญชี (รับเงินกู้เข้าบัญชีไหน) *" : "เงินออกบัญชี (ให้ยืมจากบัญชีไหน) *"}
                </label>
                <select
                  className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={relatedAccountId}
                  onChange={(e) => setRelatedAccountId(e.target.value)}
                  required
                >
                  <option value="" disabled>เลือกบัญชี</option>
                  {activeAccounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.accountName}</option>
                  ))}
                </select>
                <p className="text-[10px] text-gray-500">ยอดเงินในบัญชีจะถูกปรับอัตโนมัติเมื่อบันทึก</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">กำหนดชำระคืน (ไม่บังคับ)</label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-gray-700">หมายเหตุเพิ่มเติม (ไม่บังคับ)</label>
                <Input
                  type="text"
                  placeholder="ดอกเบี้ย, เงื่อนไขต่างๆ..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              {error && (
                <div className="md:col-span-2 text-red-600 bg-red-50 p-3 rounded-lg border border-red-200 text-sm font-medium">
                  {error}
                </div>
              )}

              <div className="md:col-span-2 flex justify-end gap-2 mt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowAddForm(false)} 
                  disabled={saving}
                >
                  ยกเลิก
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "กำลังบันทึก..." : "บันทึกรายการ"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* List */}
      {currentDebts.length === 0 && !showAddForm ? (
        <div className="p-12 text-center border-2 border-dashed border-gray-200 rounded-lg">
          <p className="text-gray-500 mb-4">
            {activeTab === "borrowed" ? "คุณไม่มีรายการหนี้สิน" : "ไม่มีใครยืมเงินคุณอยู่"}
          </p>
          <Button onClick={() => { setShowAddForm(true); setError(""); }} variant="outline">
            เริ่มสร้างรายการแรก
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentDebts.map(renderDebtCard)}
        </div>
      )}

    </div>
  );
}

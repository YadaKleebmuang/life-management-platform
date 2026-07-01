"use client";

import { useState } from "react";
import { useAccounts } from "../hooks/useAccounts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Account, AccountType } from "../types";
import { Edit2, ToggleLeft, ToggleRight, Wallet, Building2, Smartphone, PiggyBank, Plus } from "lucide-react";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
  }).format(amount);
};

export function AccountList() {
  const { accounts, addAccount, updateAccount, toggleAccountActive, loading } = useAccounts();
  
  const [accountName, setAccountName] = useState("");
  const [accountType, setAccountType] = useState<AccountType>("Cash");
  const [institutionName, setInstitutionName] = useState("");
  const [initialBalance, setInitialBalance] = useState("");
  const [note, setNote] = useState("");
  const [currency, setCurrency] = useState("THB");
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountName || !initialBalance) return;

    setSaving(true);
    try {
      if (editingId) {
        const existing = accounts.find(a => a.id === editingId);
        if (existing) {
          // Note: Cannot edit initialBalance easily without recalculating all transactions. 
          // For now, we only update metadata.
          await updateAccount({ 
            ...existing, 
            accountName, 
            accountType, 
            institutionName,
            note,
            currency
          });
        }
        setEditingId(null);
        setShowForm(false);
      } else {
        await addAccount({
          accountName,
          accountType,
          institutionName,
          initialBalance: parseFloat(initialBalance),
          currency,
          note,
          isActive: true
        });
        setShowForm(false);
      }

      resetForm();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("Error saving account:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (account: Account) => {
    setEditingId(account.id);
    setAccountName(account.accountName);
    setAccountType(account.accountType);
    setInstitutionName(account.institutionName || "");
    setInitialBalance(account.initialBalance.toString());
    setCurrency(account.currency);
    setNote(account.note || "");
    setShowForm(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setAccountName("");
    setAccountType("Cash");
    setInstitutionName("");
    setInitialBalance("");
    setCurrency("THB");
    setNote("");
  };

  const getAccountIcon = (type: AccountType) => {
    switch (type) {
      case "Cash": return <Wallet className="h-5 w-5" />;
      case "Bank": return <Building2 className="h-5 w-5" />;
      case "E-Wallet": return <Smartphone className="h-5 w-5" />;
      case "Savings": return <PiggyBank className="h-5 w-5" />;
      default: return <Wallet className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header & Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">บัญชีทั้งหมด ({accounts.length})</h2>
          <p className="text-sm text-gray-500">จัดการเงินสด บัญชีธนาคาร และกระเป๋าเงินอิเล็กทรอนิกส์ของคุณ</p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> เพิ่มบัญชี
          </Button>
        )}
      </div>

      {success && <div className="text-gray-900 bg-gray-100 p-3 rounded-lg border border-gray-200 text-sm font-medium flex items-center">
        <svg className="w-4 h-4 mr-2 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        ข้อมูลบันทึกแล้ว
      </div>}

      {showForm && (
        <Card className="border-gray-900 shadow-sm">
          <CardHeader>
            <CardTitle>{editingId ? "แก้ไขบัญชี" : "เพิ่มบัญชีใหม่"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">ชื่อบัญชี *</label>
                <Input
                  type="text"
                  placeholder="เช่น กระเป๋าตังค์, KBank, TrueMoney"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">ประเภทบัญชี *</label>
                <select
                  className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value as AccountType)}
                  required
                >
                  <option value="Cash">เงินสด (Cash)</option>
                  <option value="Bank">ธนาคาร (Bank)</option>
                  <option value="E-Wallet">กระเป๋าเงินออนไลน์ (E-Wallet)</option>
                  <option value="Savings">เงินฝากประจำ/ออมทรัพย์ (Savings)</option>
                  <option value="Other">อื่นๆ (Other)</option>
                </select>
              </div>

              {(accountType === "Bank" || accountType === "E-Wallet" || accountType === "Savings") && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">ชื่อสถาบันการเงิน</label>
                  <Input
                    type="text"
                    placeholder="เช่น กสิกรไทย, SCB, TrueMoney"
                    value={institutionName}
                    onChange={(e) => setInstitutionName(e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">ยอดยกมา / ยอดเริ่มต้น (บาท) *</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={initialBalance}
                  onChange={(e) => setInitialBalance(e.target.value)}
                  disabled={!!editingId} // Prevent editing initial balance to avoid messing up current balance
                  required
                />
                {editingId && <p className="text-xs text-gray-500">ยอดยกมาไม่สามารถแก้ไขได้หลังสร้างบัญชีแล้ว</p>}
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-gray-700">รายละเอียดเพิ่มเติม (ไม่บังคับ)</label>
                <Input
                  type="text"
                  placeholder="ระบุรายละเอียด..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              <div className="md:col-span-2 flex justify-end gap-2 mt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    resetForm();
                    setShowForm(false);
                  }} 
                  disabled={saving}
                >
                  ยกเลิก
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "กำลังบันทึก..." : (editingId ? "บันทึกการแก้ไข" : "บันทึกบัญชี")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Account Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map(account => (
          <Card key={account.id} className={`overflow-hidden transition-all ${!account.isActive ? 'opacity-60 bg-gray-50' : 'hover:border-gray-400'}`}>
            <CardHeader className="p-4 pb-2">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${account.isActive ? 'bg-gray-100 text-gray-900' : 'bg-gray-200 text-gray-400'}`}>
                    {getAccountIcon(account.accountType)}
                  </div>
                  <div>
                    <CardTitle className="text-base truncate">{account.accountName}</CardTitle>
                    <p className="text-xs text-gray-500">{account.institutionName || account.accountType}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(account)}>
                    <Edit2 className="h-4 w-4 text-gray-400 hover:text-gray-900" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleAccountActive(account)} title={account.isActive ? "ระงับบัญชี" : "เปิดใช้บัญชี"}>
                    {account.isActive ? <ToggleRight className="h-4 w-4 text-gray-900" /> : <ToggleLeft className="h-4 w-4 text-gray-400" />}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <div className="mt-4">
                <p className="text-sm text-gray-500 mb-1">ยอดเงินคงเหลือ</p>
                <h3 className={`text-2xl font-bold ${account.currentBalance < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                  {formatCurrency(account.currentBalance)}
                </h3>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between text-xs text-gray-500">
                <span>ยอดยกมา: {formatCurrency(account.initialBalance)}</span>
                {!account.isActive && <span className="text-red-500 font-medium">ถูกระงับ</span>}
              </div>
              {account.note && (
                <div className="mt-3 text-xs bg-gray-50 p-2 rounded border border-gray-100 text-gray-500 italic break-words line-clamp-2">
                  หมายเหตุ: {account.note}
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {accounts.length === 0 && !showForm && (
          <div className="col-span-full p-12 text-center border-2 border-dashed border-gray-200 rounded-lg">
            <p className="text-gray-500 mb-4">ยังไม่มีบัญชีที่บันทึกไว้</p>
            <Button onClick={() => setShowForm(true)} variant="outline">
              เพิ่มบัญชีแรกของคุณ
            </Button>
          </div>
        )}
      </div>

    </div>
  );
}

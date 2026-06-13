"use client";

import { useState } from "react";
import { useSavingsGoals } from "../../hooks/useSavingsGoals";
import { useAccounts } from "../../hooks/useAccounts";
import { SavingsGoal } from "../../types";
import { SavingsGoalCard } from "./SavingsGoalCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, X } from "lucide-react";

export function SavingsGoalList() {
  const { goals, loading: goalsLoading, addGoal, updateGoal, removeGoal, allocateFunds } = useSavingsGoals();
  const { activeAccounts, loading: accountsLoading } = useAccounts();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  
  // Allocate Modal State
  const [allocateGoal, setAllocateGoal] = useState<SavingsGoal | null>(null);
  const [allocateType, setAllocateType] = useState<"add" | "withdraw">("add");
  const [allocateAmount, setAllocateAmount] = useState("");
  const [allocateAccountId, setAllocateAccountId] = useState("");
  const [allocateNote, setAllocateNote] = useState("");

  // Form State
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [note, setNote] = useState("");

  const resetForm = () => {
    setName("");
    setTargetAmount("");
    setTargetDate("");
    setNote("");
    setEditingGoal(null);
    setShowAddForm(false);
  };

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !targetAmount) return;

    if (editingGoal) {
      await updateGoal({
        ...editingGoal,
        name,
        targetAmount: parseFloat(targetAmount),
        targetDate: targetDate || undefined,
        note,
      });
    } else {
      await addGoal({
        name,
        targetAmount: parseFloat(targetAmount),
        targetDate: targetDate || undefined,
        note,
        status: "in_progress",
        color: "bg-blue-100 text-blue-700",
      });
    }
    resetForm();
  };

  const openEdit = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setName(goal.name);
    setTargetAmount(goal.targetAmount.toString());
    setTargetDate(goal.targetDate || "");
    setNote(goal.note || "");
    setShowAddForm(true);
  };

  const handleDelete = async (goalId: string) => {
    if (confirm("คุณต้องการลบเป้าหมายการออมนี้ใช่หรือไม่?")) {
      await removeGoal(goalId);
    }
  };

  const handleAllocateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allocateGoal || !allocateAmount || !allocateAccountId) return;

    const amount = parseFloat(allocateAmount);
    if (amount <= 0) return;

    await allocateFunds(
      allocateGoal.id,
      allocateAccountId,
      amount,
      allocateType,
      new Date().toISOString(),
      allocateNote
    );

    // Check if goal completed
    if (allocateType === "add" && allocateGoal.currentAmount + amount >= allocateGoal.targetAmount) {
      await updateGoal({
        ...allocateGoal,
        currentAmount: allocateGoal.currentAmount + amount,
        status: "completed"
      });
    }

    setAllocateGoal(null);
    setAllocateAmount("");
    setAllocateAccountId("");
    setAllocateNote("");
  };

  if (goalsLoading || accountsLoading) {
    return (
      <div className="flex justify-center p-12">
        <div className="w-8 h-8 border-4 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const inProgressGoals = goals.filter(g => g.status === "in_progress");
  const completedGoals = goals.filter(g => g.status === "completed");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">เป้าหมายการออม ({inProgressGoals.length})</h2>
          <p className="text-xs text-gray-500 mt-1">เงินที่โยกมาเก็บในเป้าหมาย จะยังคงอยู่ในบัญชีเดิมของคุณ (ไม่ถูกหักยอด)</p>
        </div>
        {!showAddForm && (
          <Button onClick={() => setShowAddForm(true)} className="flex items-center gap-2" size="sm">
            <Plus className="h-4 w-4" /> สร้างเป้าหมาย
          </Button>
        )}
      </div>

      {showAddForm && (
        <Card className="border-gray-900 shadow-sm relative">
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-900"
            onClick={resetForm}
          >
            <X className="h-4 w-4" />
          </Button>
          <CardHeader>
            <CardTitle>{editingGoal ? "แก้ไขเป้าหมาย" : "สร้างเป้าหมายการออมใหม่"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveGoal} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">ชื่อเป้าหมาย *</label>
                <Input placeholder="เช่น เก็บเงินดาวน์รถ, เงินสำรอง" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">ยอดเงินเป้าหมาย (บาท) *</label>
                <Input type="number" min="1" step="0.01" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">วันที่คาดว่าจะสำเร็จ (ไม่บังคับ)</label>
                <Input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">หมายเหตุ</label>
                <Input placeholder="รายละเอียด..." value={note} onChange={(e) => setNote(e.target.value)} />
              </div>
              <div className="md:col-span-2 flex justify-end mt-2">
                <Button type="submit">{editingGoal ? "บันทึกการแก้ไข" : "บันทึกเป้าหมาย"}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Allocate Modal Overlay */}
      {allocateGoal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md relative">
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-900"
              onClick={() => setAllocateGoal(null)}
            >
              <X className="h-4 w-4" />
            </Button>
            <CardHeader>
              <CardTitle>
                {allocateType === "add" ? "โยกเงินเข้าเป้าหมาย" : "ดึงเงินออกจากเป้าหมาย"}
              </CardTitle>
              <p className="text-sm text-gray-500">เป้าหมาย: {allocateGoal.name}</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAllocateSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">จำนวนเงิน (บาท) *</label>
                  <Input type="number" min="0.01" step="0.01" value={allocateAmount} onChange={(e) => setAllocateAmount(e.target.value)} required />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    {allocateType === "add" ? "นำเงินมาจากบัญชีไหน?" : "คืนเงินเข้าบัญชีไหน?"} *
                  </label>
                  <select
                    className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                    value={allocateAccountId}
                    onChange={(e) => setAllocateAccountId(e.target.value)}
                    required
                  >
                    <option value="" disabled>เลือกบัญชี</option>
                    {activeAccounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.accountName} ({acc.currentBalance.toLocaleString('th-TH')} บาท)
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-gray-500">
                    *ระบบจะไม่ไปหักยอดเงินในบัญชีของคุณ การกระทำนี้เป็นเพียงการจัดสรรเงินจำลองเท่านั้น
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">หมายเหตุ</label>
                  <Input placeholder="เช่น เงินเดือนเดือนนี้, โบนัส" value={allocateNote} onChange={(e) => setAllocateNote(e.target.value)} />
                </div>

                <div className="flex justify-end pt-4">
                  <Button type="submit" className={allocateType === "add" ? "bg-blue-600 hover:bg-blue-700" : "bg-orange-600 hover:bg-orange-700"}>
                    ยืนยัน
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {goals.length === 0 && !showAddForm ? (
        <div className="p-12 text-center border-2 border-dashed border-gray-200 rounded-lg">
          <p className="text-gray-500 mb-4">ยังไม่มีเป้าหมายการออม</p>
          <Button onClick={() => setShowAddForm(true)} variant="outline">
            ตั้งเป้าหมายแรก
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {inProgressGoals.map(goal => (
            <SavingsGoalCard 
              key={goal.id} 
              goal={goal} 
              onEdit={openEdit}
              onDelete={handleDelete}
              onAllocate={(g, t) => { setAllocateGoal(g); setAllocateType(t); }}
            />
          ))}
          {completedGoals.map(goal => (
            <SavingsGoalCard 
              key={goal.id} 
              goal={goal} 
              onEdit={openEdit}
              onDelete={handleDelete}
              onAllocate={(g, t) => { setAllocateGoal(g); setAllocateType(t); }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

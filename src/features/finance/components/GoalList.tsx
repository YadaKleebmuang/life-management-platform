"use client";

import { useState } from "react";
import { useGoals } from "../hooks/useGoals";
import { useAccounts } from "../hooks/useAccounts";
import { formatCurrency } from "../utils/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Goal } from "../types";
import { Target, Plus } from "lucide-react";

export function GoalList() {
  const { goals, loading: goalsLoading, addGoal, addContribution } = useGoals();
  const { activeAccounts, loading: accountsLoading } = useAccounts();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [showContributeFormId, setShowContributeFormId] = useState<string | null>(null);

  // Add Goal Form
  const [goalName, setGoalName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [note, setNote] = useState("");
  
  // Contribute Form
  const [contribAmount, setContribAmount] = useState("");
  const [contribAccountId, setContribAccountId] = useState("");
  const [contribDate, setContribDate] = useState(new Date().toISOString().split("T")[0]);
  const [contribNote, setContribNote] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalName || !targetAmount) return;

    const amount = parseFloat(targetAmount);
    if (amount <= 0) {
      setError("เป้าหมายต้องมากกว่า 0");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await addGoal({
        goalName,
        targetAmount: amount,
        startDate: new Date().toISOString(),
        targetDate: targetDate || undefined,
        note,
      });

      setGoalName("");
      setTargetAmount("");
      setTargetDate("");
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

  const handleContribute = async (e: React.FormEvent, goal: Goal) => {
    e.preventDefault();
    if (!contribAmount || !contribAccountId) return;

    const amount = parseFloat(contribAmount);
    if (amount <= 0) {
      setError("จำนวนเงินไม่ถูกต้อง");
      return;
    }

    const acc = activeAccounts.find(a => a.id === contribAccountId);
    if (acc && acc.currentBalance < amount) {
      setError("ยอดเงินในบัญชีไม่พอสำหรับหยอดกระปุก");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await addContribution({
        goalId: goal.id,
        accountId: contribAccountId,
        amount,
        contributionDate: contribDate,
        note: contribNote,
      });

      setContribAmount("");
      setContribAccountId("");
      setContribNote("");
      setContribDate(new Date().toISOString().split("T")[0]);
      setShowContributeFormId(null);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "เกิดข้อผิดพลาด");
    } finally {
      setSaving(false);
    }
  };

  const renderGoalCard = (goal: Goal) => {
    const isCompleted = goal.status === "completed";
    const isContributing = showContributeFormId === goal.id;
    let progressPercent = (goal.currentAmount / goal.targetAmount) * 100;
    if (progressPercent > 100) progressPercent = 100;

    return (
      <Card key={goal.id} className={`overflow-hidden transition-all ${isCompleted ? 'border-gray-200 bg-gray-50' : 'hover:border-gray-400'}`}>
        <CardContent className="p-5">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-lg ${isCompleted ? 'bg-gray-200 text-gray-500' : 'bg-gray-100 text-gray-900'}`}>
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">{goal.goalName}</h3>
                {goal.targetDate && <p className="text-xs text-gray-500">เป้าหมาย: {new Date(goal.targetDate).toLocaleDateString("th-TH")}</p>}
              </div>
            </div>
            {isCompleted && (
              <span className="px-2.5 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium border border-green-200">
                สำเร็จแล้ว 🎉
              </span>
            )}
          </div>

          <div className="flex justify-between items-end mb-2">
            <div>
              <p className="text-xs text-gray-500 mb-1">เก็บได้แล้ว</p>
              <p className={`text-xl font-bold ${isCompleted ? 'text-green-600' : 'text-gray-900'}`}>
                {formatCurrency(goal.currentAmount)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 mb-1">เป้าหมาย</p>
              <p className="text-sm font-medium text-gray-500">
                {formatCurrency(goal.targetAmount)}
              </p>
            </div>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2 mb-1 overflow-hidden">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${isCompleted ? 'bg-green-500' : 'bg-gray-900'}`} 
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          <div className="text-right mb-4 text-[10px] text-gray-500 font-medium">
            {progressPercent.toFixed(1)}%
          </div>

          {!isCompleted && (
            <div className="pt-4 border-t border-gray-100">
              {!isContributing ? (
                <Button variant="outline" className="w-full" onClick={() => {
                  setShowContributeFormId(goal.id);
                  setError("");
                }}>
                  หยอดกระปุก
                </Button>
              ) : (
                <form onSubmit={(e) => handleContribute(e, goal)} className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">หยอดกระปุกเพิ่ม</h4>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-700">วันที่ *</label>
                    <Input type="date" className="h-8 text-sm" value={contribDate} onChange={(e) => setContribDate(e.target.value)} required />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-700">จำนวนเงิน (บาท) *</label>
                    <Input type="number" min="0" step="0.01" className="h-8 text-sm" placeholder="0.00" value={contribAmount} onChange={(e) => setContribAmount(e.target.value)} required />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-700">หักจากบัญชี *</label>
                    <select
                      className="flex h-8 w-full rounded-md border border-gray-200 bg-white px-2 py-1 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2"
                      value={contribAccountId}
                      onChange={(e) => setContribAccountId(e.target.value)}
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
                    <Input type="text" className="h-8 text-sm" placeholder="โบนัส, เงินเหลือ..." value={contribNote} onChange={(e) => setContribNote(e.target.value)} />
                  </div>

                  {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

                  <div className="flex gap-2 pt-2">
                    <Button type="button" variant="ghost" size="sm" className="flex-1 text-xs" onClick={() => setShowContributeFormId(null)} disabled={saving}>
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

  if (goalsLoading || accountsLoading) {
    return (
      <div className="flex justify-center p-12">
        <div className="w-8 h-8 border-4 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">เป้าหมายทั้งหมด ({goals.length})</h2>
        {!showAddForm && (
          <Button onClick={() => { setShowAddForm(true); setError(""); }} className="flex items-center gap-2" size="sm">
            <Plus className="h-4 w-4" /> สร้างเป้าหมาย
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
            <CardTitle>สร้างเป้าหมายการออมใหม่</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddGoal} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">ชื่อเป้าหมาย *</label>
                <Input
                  type="text"
                  placeholder="เช่น ซื้อรถใหม่, เที่ยวญี่ปุ่น"
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">เป้าหมาย (บาท) *</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">กำหนดถึงเป้าหมาย (ไม่บังคับ)</label>
                <Input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">หมายเหตุเพิ่มเติม (ไม่บังคับ)</label>
                <Input
                  type="text"
                  placeholder="รายละเอียด..."
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
                  {saving ? "กำลังสร้าง..." : "สร้างเป้าหมาย"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {goals.length === 0 && !showAddForm ? (
        <div className="p-12 text-center border-2 border-dashed border-gray-200 rounded-lg">
          <p className="text-gray-500 mb-4">ยังไม่มีเป้าหมายการออม</p>
          <Button onClick={() => { setShowAddForm(true); setError(""); }} variant="outline">
            ตั้งเป้าหมายแรกของคุณ
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map(renderGoalCard)}
        </div>
      )}

    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useFinanceData } from "../hooks/useFinanceData";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SettingsPanel() {
  const { allocation, updateAllocation } = useFinanceData();
  const [spending, setSpending] = useState(allocation.spendingPercentage.toString());
  const [savings, setSavings] = useState(allocation.savingsPercentage.toString());
  const [emergency, setEmergency] = useState(allocation.emergencyFundPercentage.toString());
  const [error, setError] = useState("");

  useEffect(() => {
    setSpending(allocation.spendingPercentage.toString());
    setSavings(allocation.savingsPercentage.toString());
    setEmergency(allocation.emergencyFundPercentage.toString());
  }, [allocation]);

  const handleSave = () => {
    const s = parseFloat(spending);
    const sav = parseFloat(savings);
    const e = parseFloat(emergency);

    if (isNaN(s) || isNaN(sav) || isNaN(e)) {
      setError("กรุณากรอกตัวเลขที่ถูกต้อง");
      return;
    }

    if (s + sav + e !== 100) {
      setError("สัดส่วนรวมกันต้องเท่ากับ 100%");
      return;
    }

    setError("");
    updateAllocation({
      spendingPercentage: s,
      savingsPercentage: sav,
      emergencyFundPercentage: e,
    });
  };

  return (
    <Card className="max-w-xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>ตั้งค่าสัดส่วนงบประมาณ</CardTitle>
        <CardDescription>
          กำหนดสัดส่วนการแบ่งเงินรายรับของคุณ ค่าเริ่มต้นคือ 60% สำหรับใช้จ่าย, 20% สำหรับเงินออม, และ 20% สำหรับฉุกเฉิน
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-blue-300">ใช้จ่าย (%)</label>
            <Input 
              type="number" 
              value={spending} 
              onChange={(e) => setSpending(e.target.value)} 
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-purple-300">เงินออม (%)</label>
            <Input 
              type="number" 
              value={savings} 
              onChange={(e) => setSavings(e.target.value)} 
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-amber-300">สำรองฉุกเฉิน (%)</label>
            <Input 
              type="number" 
              value={emergency} 
              onChange={(e) => setEmergency(e.target.value)} 
            />
          </div>

          {error && <div className="text-red-400 text-sm font-medium">{error}</div>}

          <div className="pt-4 border-t border-slate-800">
            <Button onClick={handleSave} className="w-full">
              บันทึกการตั้งค่า
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

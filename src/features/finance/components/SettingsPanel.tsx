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
  const [success, setSuccess] = useState(false);

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
    setSuccess(false);
    updateAllocation({
      spendingPercentage: s,
      savingsPercentage: sav,
      emergencyFundPercentage: e,
    });
    setSuccess(true);
    
    // ซ่อนข้อความแจ้งเตือนความสำเร็จหลังจาก 3 วินาที
    setTimeout(() => {
      setSuccess(false);
    }, 3000);
  };

  return (
    <Card className="max-w-xl mx-auto mt-8 border-gray-200">
      <CardHeader className="pb-6">
        <CardTitle className="text-gray-900">ตั้งค่าสัดส่วนงบประมาณ</CardTitle>
        <CardDescription className="text-gray-500">
          กำหนดสัดส่วนการแบ่งเงินรายรับของคุณ ค่าเริ่มต้นคือ 60% สำหรับใช้จ่าย, 20% สำหรับเงินออม, และ 20% สำหรับฉุกเฉิน
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">ใช้จ่าย (%)</label>
            <Input 
              type="number" 
              value={spending} 
              onChange={(e) => setSpending(e.target.value)} 
              className="bg-gray-50"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">เงินออม (%)</label>
            <Input 
              type="number" 
              value={savings} 
              onChange={(e) => setSavings(e.target.value)} 
              className="bg-gray-50"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">สำรองฉุกเฉิน (%)</label>
            <Input 
              type="number" 
              value={emergency} 
              onChange={(e) => setEmergency(e.target.value)} 
              className="bg-gray-50"
            />
          </div>

          {error && <div className="text-gray-900 bg-gray-100 p-3 rounded-lg border border-gray-200 text-sm font-medium">{error}</div>}
          {success && <div className="text-gray-900 bg-gray-100 p-3 rounded-lg border border-gray-200 text-sm font-medium flex items-center">
            <svg className="w-4 h-4 mr-2 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            ข้อมูลบันทึกแล้ว
          </div>}

          <div className="pt-6 mt-6 border-t border-gray-100">
            <Button onClick={handleSave} className="w-full">
              บันทึกการตั้งค่า
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

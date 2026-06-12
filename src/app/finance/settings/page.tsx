import { SettingsPanel } from "@/features/finance/components/SettingsPanel";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "ตั้งค่า | Life Platform",
};

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">ตั้งค่างบประมาณ</h1>
        <p className="text-slate-400 mt-1">
          ปรับแต่งสัดส่วนการจัดการเงินของคุณให้เหมาะสมกับเป้าหมาย
        </p>
      </div>
      
      <SettingsPanel />
    </div>
  );
}

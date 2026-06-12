import { DashboardSummary } from "@/features/finance/components/DashboardSummary";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "แดชบอร์ด | Life Platform",
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">ภาพรวมการเงิน</h1>
        <p className="text-gray-500 mt-1">
          สรุปสถานะการเงินของคุณประจำวัน
        </p>
      </div>
      
      <DashboardSummary />
    </div>
  );
}

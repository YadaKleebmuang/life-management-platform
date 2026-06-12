import { IncomeList } from "@/features/finance/components/IncomeList";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "รายรับ | Life Platform",
};

export default function IncomePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">จัดการรายรับ</h1>
        <p className="text-gray-500 mt-1">
          บันทึกและจัดการแหล่งที่มารายรับของคุณ
        </p>
      </div>
      
      <IncomeList />
    </div>
  );
}

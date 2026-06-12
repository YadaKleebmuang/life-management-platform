import { MonthlySummary } from "@/features/finance/components/MonthlySummary";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "สรุปรายเดือน | Life Platform",
};

export default function SummaryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">สรุปรายเดือน</h1>
        <p className="text-gray-500 mt-1">
          ดูสรุปรายได้และรายจ่ายที่เกิดขึ้นในแต่ละเดือน
        </p>
      </div>
      
      <MonthlySummary />
    </div>
  );
}

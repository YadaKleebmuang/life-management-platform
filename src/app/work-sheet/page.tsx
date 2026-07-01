import type { Metadata } from "next";
import { WorkSheetBoard } from "@/features/work-sheet/components/WorkSheetBoard";

export const metadata: Metadata = {
  title: "Work Sheet | Life Management Platform",
  description: "ติดตามงาน รายรับจากงาน และยอดจ่ายที่คงเหลือสำหรับทุกคนในทีม",
};

export default function WorkSheetPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Work Sheet</h1>
        <p className="mt-1 text-gray-500">
          ดูรายการงานของทุกคน ยอดที่ต้องจ่าย จ่ายไปแล้ว และยอดคงเหลือจากหน้าเดียว
        </p>
      </div>
      <WorkSheetBoard />
    </div>
  );
}


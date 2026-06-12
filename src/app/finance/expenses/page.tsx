import { ExpenseList } from "@/features/finance/components/ExpenseList";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "รายจ่าย | Life Platform",
};

export default function ExpensesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">การจัดการรายจ่าย</h1>
        <p className="text-slate-400 mt-1">
          บันทึกและตรวจสอบค่าใช้จ่ายของคุณ
        </p>
      </div>
      
      <ExpenseList />
    </div>
  );
}

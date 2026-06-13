import { SavingsGoalList } from "@/features/finance/components/goals/SavingsGoalList";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "เป้าหมายการออม | Life Platform",
};

export default function GoalsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">เป้าหมายการออม</h1>
        <p className="text-gray-500 mt-1">
          สร้างเป้าหมายและจัดสรรเงินของคุณโดยไม่กระทบยอดเงินจริงในบัญชี
        </p>
      </div>
      
      <SavingsGoalList />
    </div>
  );
}

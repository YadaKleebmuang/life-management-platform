import { GoalList } from "@/features/finance/components/GoalList";

export default function GoalsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">เป้าหมายการออม</h1>
      <p className="text-gray-500 text-sm">ตั้งเป้าหมายและบันทึกการออมเงินของคุณทีละเล็กทีละน้อยจนกว่าจะสำเร็จ</p>
      <GoalList />
    </div>
  );
}

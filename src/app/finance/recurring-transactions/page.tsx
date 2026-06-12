import { RecurringTransactionList } from "@/features/finance/components/RecurringTransactionList";

export default function RecurringTransactionsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">รายการประจำอัตโนมัติ</h1>
      <p className="text-gray-500 text-sm">ตั้งค่ารายการรายรับหรือรายจ่ายที่เกิดขึ้นเป็นประจำ (เช่น เงินเดือน, ค่าเช่า) ระบบจะบันทึกให้อัตโนมัติเมื่อถึงกำหนด</p>
      <RecurringTransactionList />
    </div>
  );
}

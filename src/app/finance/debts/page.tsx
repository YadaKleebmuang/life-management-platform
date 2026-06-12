import { DebtList } from "@/features/finance/components/DebtList";

export default function DebtsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">ระบบจัดการหนี้สิน</h1>
      <p className="text-gray-500 text-sm">ติดตามรายการหนี้สินที่คุณยืมมา หรือเงินที่คุณให้คนอื่นยืม พร้อมระบบผ่อนชำระคืน</p>
      <DebtList />
    </div>
  );
}

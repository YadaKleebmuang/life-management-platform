import { TransferList } from "@/features/finance/components/TransferList";

export default function TransfersPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">โอนเงินข้ามบัญชี</h1>
      <p className="text-gray-500 text-sm">ย้ายเงินระหว่างบัญชีต่างๆ ของคุณ พร้อมบันทึกประวัติการทำรายการ</p>
      <TransferList />
    </div>
  );
}

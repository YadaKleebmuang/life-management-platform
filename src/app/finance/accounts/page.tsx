import { AccountList } from "@/features/finance/components/AccountList";

export default function AccountsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">บัญชีของฉัน</h1>
      <p className="text-gray-500 text-sm">ดูภาพรวมและจัดการบัญชีการเงินทั้งหมดของคุณ</p>
      <AccountList />
    </div>
  );
}

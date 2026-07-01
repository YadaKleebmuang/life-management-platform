import type { Metadata } from "next";
import { TransactionManagementBoard } from "@/features/finance/components/TransactionManagementBoard";

export const metadata: Metadata = {
  title: "จัดการธุรกรรมการเงิน | Life Platform",
  description: "บันทึกและตรวจสอบรายรับ รายจ่าย และการโอนเงินของคุณในที่เดียว",
};

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; tab?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const activeType = resolvedSearchParams.type ?? resolvedSearchParams.tab ?? "all";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">จัดการธุรกรรมการเงิน</h1>
        <p className="mt-1 text-gray-500">
          บันทึกและตรวจสอบรายรับ รายจ่าย และการโอนเงินของคุณในที่เดียว
        </p>
      </div>

      <TransactionManagementBoard key={activeType} />
    </div>
  );
}

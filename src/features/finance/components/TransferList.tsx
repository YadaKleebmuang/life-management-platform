"use client";

import { useState } from "react";
import { useTransfers } from "../hooks/useTransfers";
import { useAccounts } from "../hooks/useAccounts";
import { formatCurrency } from "../utils/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PaginationControls } from "@/components/ui/pagination";
import { ArrowRightLeft } from "lucide-react";
import { usePagination } from "@/hooks/usePagination";

export function TransferList() {
  const { transfers, addTransfer, loading: transfersLoading } = useTransfers();
  const { activeAccounts, loading: accountsLoading } = useAccounts();
  const transferPagination = usePagination(transfers, 10);
  const paginatedTransfers = transferPagination.paginatedItems;
  
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split("T")[0]);
  const [fromAccountId, setFromAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromAccountId || !toAccountId || !amount) return;

    if (fromAccountId === toAccountId) {
      setError("บัญชีต้นทางและปลายทางต้องไม่เป็นบัญชีเดียวกัน");
      return;
    }

    const transferAmount = parseFloat(amount);
    if (transferAmount <= 0) {
      setError("จำนวนเงินต้องมากกว่า 0");
      return;
    }

    // Checking source balance locally as a quick validation
    const sourceAcc = activeAccounts.find(a => a.id === fromAccountId);
    if (sourceAcc && sourceAcc.currentBalance < transferAmount) {
      setError("ยอดเงินในบัญชีต้นทางไม่เพียงพอ");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await addTransfer({
        fromAccountId,
        toAccountId,
        amount: transferAmount,
        transferDate,
        note,
      });

      resetForm();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      console.error("Error saving transfer:", err);
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการโอนเงิน");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setTransferDate(new Date().toISOString().split("T")[0]);
    setFromAccountId("");
    setToAccountId("");
    setAmount("");
    setNote("");
    setError("");
  };

  const getAccountName = (accId?: string) => {
    if (!accId) return "-";
    const acc = activeAccounts.find(a => a.id === accId);
    return acc ? acc.accountName : "ไม่พบข้อมูลบัญชี";
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>โอนเงินระหว่างบัญชี</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">วันที่ *</label>
              <Input type="date" value={transferDate} onChange={(e) => setTransferDate(e.target.value)} required />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">จำนวนเงิน (บาท) *</label>
              <Input type="number" min="0" step="0.01" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">จากบัญชี (ต้นทาง) *</label>
              <select
                className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={fromAccountId}
                onChange={(e) => setFromAccountId(e.target.value)}
                required
              >
                <option value="" disabled>เลือกบัญชีต้นทาง</option>
                {activeAccounts.map(acc => (
                  <option key={`from-${acc.id}`} value={acc.id}>
                    {acc.accountName} (คงเหลือ {formatCurrency(acc.currentBalance)})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">ไปยังบัญชี (ปลายทาง) *</label>
              <select
                className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={toAccountId}
                onChange={(e) => setToAccountId(e.target.value)}
                required
              >
                <option value="" disabled>เลือกบัญชีปลายทาง</option>
                {activeAccounts.map(acc => (
                  <option key={`to-${acc.id}`} value={acc.id}>{acc.accountName}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-medium text-gray-700">บันทึกเพิ่มเติม (ไม่บังคับ)</label>
              <Input placeholder="รายละเอียดการโอน..." value={note} onChange={(e) => setNote(e.target.value)} />
            </div>

            {error && (
              <div className="md:col-span-2 text-red-600 bg-red-50 p-3 rounded-lg border border-red-200 text-sm font-medium">
                {error}
              </div>
            )}

            {success && (
              <div className="md:col-span-2 text-gray-900 bg-gray-100 p-3 rounded-lg border border-gray-200 text-sm font-medium flex items-center">
                <svg className="w-4 h-4 mr-2 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                โอนเงินสำเร็จแล้ว
              </div>
            )}

            <div className="md:col-span-2 flex justify-end mt-4">
              <Button type="submit" disabled={saving}>
                {saving ? "กำลังดำเนินการ..." : "ยืนยันการโอนเงิน"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>ประวัติการโอนเงิน</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 font-semibold">วันที่</th>
                  <th className="px-4 py-3 font-semibold hidden md:table-cell">รายละเอียด</th>
                  <th className="px-4 py-3 font-semibold">เส้นทาง</th>
                  <th className="px-4 py-3 font-semibold text-right">จำนวนเงิน</th>
                </tr>
              </thead>
              <tbody>
                {transfersLoading || accountsLoading ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                      กำลังโหลดข้อมูล...
                    </td>
                  </tr>
                ) : paginatedTransfers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                      ยังไม่มีประวัติการโอนเงิน
                    </td>
                  </tr>
                ) : (
                  paginatedTransfers.map((t) => (
                    <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-900">{new Date(t.transferDate).toLocaleDateString("th-TH")}</td>
                      <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{t.note || "-"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-900 font-medium">{getAccountName(t.fromAccountId)}</span>
                          <ArrowRightLeft className="h-3 w-3 text-gray-400" />
                          <span className="text-gray-900 font-medium">{getAccountName(t.toAccountId)}</span>
                        </div>
                        <div className="text-xs text-gray-500 block md:hidden mt-1">{t.note || "-"}</div>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-900 font-medium">
                        {formatCurrency(t.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <PaginationControls
            currentPage={transferPagination.currentPage}
            totalPages={transferPagination.totalPages}
            totalItems={transferPagination.totalItems}
            pageSize={transferPagination.pageSize}
            startItem={transferPagination.startItem}
            endItem={transferPagination.endItem}
            onPageChange={transferPagination.setCurrentPage}
            label="รายการโอนเงิน"
          />
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useMemo } from "react";
import { X, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PaginationControls } from "@/components/ui/pagination";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDateThai } from "@/features/finance/utils/formatters";
import { usePagination } from "@/hooks/usePagination";
import type { WorkItem, WorkPayment } from "../types";
import {
  buildParticipantPaymentSummary,
  buildWorkPaymentHistory,
  getPaymentTypeLabel,
} from "../utils/work-calculations";

interface WorkDetailModalProps {
  item: WorkItem;
  payments: WorkPayment[];
  onClose: () => void;
}

const financialBadgeClasses = {
  unpaid: "bg-gray-100 text-gray-700",
  partial: "bg-yellow-100 text-yellow-800",
  paid: "bg-green-100 text-green-800",
  overpaid: "bg-red-100 text-red-700",
  cancelled: "bg-slate-100 text-slate-600",
} as const;

const paymentTypeClasses = {
  deposit: "bg-blue-100 text-blue-800",
  installment: "bg-amber-100 text-amber-800",
  final: "bg-purple-100 text-purple-800",
  manual: "bg-gray-100 text-gray-700",
} as const;

export function WorkDetailModal({ item, payments, onClose }: WorkDetailModalProps) {
  const participantSummaries = useMemo(
    () => item.participants.map((participant) => buildParticipantPaymentSummary(participant, payments)),
    [item.participants, payments]
  );
  const paymentHistory = useMemo(() => buildWorkPaymentHistory(payments), [payments]);
  const participantPagination = usePagination(participantSummaries, 10);
  const paymentPagination = usePagination(paymentHistory, 10);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4">
      <div className="mx-auto my-6 w-full max-w-6xl">
        <Card className="border-gray-200 shadow-2xl">
          <CardHeader className="flex flex-row items-start justify-between gap-4 border-b border-gray-100">
            <div className="space-y-1">
              <CardTitle className="text-xl text-gray-900">{item.workTitle}</CardTitle>
              <p className="text-sm text-gray-500">
                งานนี้คืออะไร: {item.workDetail || "-"}
              </p>
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>

          <CardContent className="space-y-6 pt-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <InfoCard label="วันที่รับงาน" value={item.workDate ? formatDateThai(item.workDate) : "-"} />
              <InfoCard label="ราคางานทั้งหมด" value={formatCurrency(item.jobPrice)} />
              <InfoCard label="จำนวนคนหาร" value={`${item.participantCount} คน`} />
              <InfoCard label="สถานะการเงินรวม" value={item.financialStatus} badgeClass={financialBadgeClasses[item.financialStatus]} />
              <InfoCard label="มัดจำรวม" value={formatCurrency(item.depositAmount)} />
              <InfoCard label="ยอดจ่ายแล้วรวม" value={formatCurrency(item.paidAmount)} />
              <InfoCard label="ยอดคงเหลือรวม" value={formatCurrency(item.remainingAmount)} />
              <InfoCard label="จำนวนรอบแก้ฟรี" value={`${item.revisionCount} รอบ`} />
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <Card className="border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">สรุปรายละเอียดงาน</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-gray-700">
                  <div className="grid gap-3 md:grid-cols-2">
                    <DetailRow label="ค่าแก้เพิ่มต่อรอบ" value={formatCurrency(item.revisionFee)} />
                    <DetailRow label="ยอดรวมทั้งหมด" value={formatCurrency(item.totalAmount)} />
                    <DetailRow label="มัดจำรูปแบบ" value={item.depositType === "fixed" ? "จำนวนเงิน" : "เปอร์เซ็นต์"} />
                    <DetailRow label="ลิงก์งาน" value={item.workLink ? "มี" : "-"} />
                  </div>
                  {item.workLink && (
                    <a href={item.workLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-gray-900 hover:underline">
                      <Link2 className="h-4 w-4" />
                      เปิดลิงก์งาน
                    </a>
                  )}
                  {item.attachmentUrl && (
                    <a href={item.attachmentUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-gray-900 hover:underline">
                      <Link2 className="h-4 w-4" />
                      เปิดรูปงาน / ไฟล์แนบ
                    </a>
                  )}
                  {item.note && <p className="rounded-xl bg-gray-50 p-3">{item.note}</p>}
                </CardContent>
              </Card>

              <Card className="border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">รายชื่อคนหาร</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {item.participants.map((participant) => (
                    <div key={participant.id} className="rounded-xl border border-gray-200 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-medium text-gray-900">{participant.name}</div>
                        <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", financialBadgeClasses[participant.financialStatus])}>
                          {participant.financialStatus}
                        </span>
                      </div>
                      <div className="mt-2 grid gap-2 text-sm text-gray-600">
                        <DetailRow label="ยอดที่ต้องจ่าย" value={formatCurrency(participant.amount)} />
                        <DetailRow label="จ่ายแล้ว" value={formatCurrency(participant.paidAmount)} />
                        <DetailRow label="คงเหลือ" value={formatCurrency(participant.remainingAmount)} />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <Card className="border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">ตารางการจ่ายรายคน</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-[1100px] w-full text-left text-sm">
                    <thead className="border-y border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
                      <tr>
                        <th className="px-3 py-3 font-semibold">ชื่อ</th>
                        <th className="px-3 py-3 font-semibold text-right">ยอดที่ต้องจ่าย</th>
                        <th className="px-3 py-3 font-semibold text-right">จ่ายมัดจำแล้ว</th>
                        <th className="px-3 py-3 font-semibold text-right">จ่ายยอดคงเหลือแล้ว</th>
                        <th className="px-3 py-3 font-semibold text-right">จ่ายค่าแก้เพิ่มแล้ว</th>
                        <th className="px-3 py-3 font-semibold text-right">รวมจ่ายแล้ว</th>
                        <th className="px-3 py-3 font-semibold text-right">คงเหลือ</th>
                        <th className="px-3 py-3 font-semibold">สถานะรายคน</th>
                      </tr>
                    </thead>
                    <tbody>
                      {participantPagination.paginatedItems.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-3 py-8 text-center text-gray-500">
                            ไม่มีข้อมูลผู้รับงาน
                          </td>
                        </tr>
                      ) : (
                        participantPagination.paginatedItems.map((summary) => (
                          <tr key={summary.participantId} className="border-b border-gray-50">
                            <td className="px-3 py-3 font-medium text-gray-900">{summary.participantName}</td>
                            <td className="px-3 py-3 text-right">{formatCurrency(summary.requiredAmount)}</td>
                            <td className="px-3 py-3 text-right">{formatCurrency(summary.depositPaidAmount)}</td>
                            <td className="px-3 py-3 text-right">{formatCurrency(summary.remainingPaidAmount)}</td>
                            <td className="px-3 py-3 text-right">{formatCurrency(summary.revisionPaidAmount)}</td>
                            <td className="px-3 py-3 text-right font-semibold text-gray-900">{formatCurrency(summary.totalPaidAmount)}</td>
                            <td className="px-3 py-3 text-right font-semibold text-red-600">{formatCurrency(Math.max(0, summary.remainingAmount))}</td>
                            <td className="px-3 py-3">
                              <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-medium", financialBadgeClasses[summary.financialStatus])}>
                                {summary.financialStatus}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <PaginationControls
                  currentPage={participantPagination.currentPage}
                  totalPages={participantPagination.totalPages}
                  totalItems={participantPagination.totalItems}
                  pageSize={participantPagination.pageSize}
                  startItem={participantPagination.startItem}
                  endItem={participantPagination.endItem}
                  onPageChange={participantPagination.setCurrentPage}
                  label="รายการผู้รับงาน"
                />
              </CardContent>
            </Card>

            <Card className="border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Payment History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-[1100px] w-full text-left text-sm">
                    <thead className="border-y border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
                      <tr>
                        <th className="px-3 py-3 font-semibold">วันที่จ่าย</th>
                        <th className="px-3 py-3 font-semibold">ชื่อคนจ่าย</th>
                        <th className="px-3 py-3 font-semibold">ประเภทการจ่าย</th>
                        <th className="px-3 py-3 font-semibold text-right">จำนวนเงิน</th>
                        <th className="px-3 py-3 font-semibold">หมายเหตุ</th>
                        <th className="px-3 py-3 font-semibold">หลักฐานการโอน</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentPagination.paginatedItems.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-3 py-8 text-center text-gray-500">
                            ยังไม่มีประวัติการจ่าย
                          </td>
                        </tr>
                      ) : (
                        paymentPagination.paginatedItems.map((payment) => (
                          <tr key={payment.id} className="border-b border-gray-50">
                            <td className="px-3 py-3 text-gray-700">{payment.paymentDate ? formatDateThai(payment.paymentDate) : "-"}</td>
                            <td className="px-3 py-3 font-medium text-gray-900">{payment.participantName || payment.clientName || "-"}</td>
                            <td className="px-3 py-3">
                              <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-medium", paymentTypeClasses[payment.paymentType])}>
                                {getPaymentTypeLabel(payment.paymentType)}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-right font-semibold text-gray-900">{formatCurrency(payment.amount)}</td>
                            <td className="px-3 py-3 text-gray-600">{payment.note || "-"}</td>
                            <td className="px-3 py-3 text-gray-600">
                              {payment.proofUrl ? (
                                <a href={payment.proofUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-gray-900 hover:underline">
                                  <Link2 className="h-4 w-4" />
                                  เปิดหลักฐาน
                                </a>
                              ) : (
                                "-"
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <PaginationControls
                  currentPage={paymentPagination.currentPage}
                  totalPages={paymentPagination.totalPages}
                  totalItems={paymentPagination.totalItems}
                  pageSize={paymentPagination.pageSize}
                  startItem={paymentPagination.startItem}
                  endItem={paymentPagination.endItem}
                  onPageChange={paymentPagination.setCurrentPage}
                  label="ประวัติการจ่าย"
                />
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InfoCard({
  label,
  value,
  badgeClass,
}: {
  label: string;
  value: string;
  badgeClass?: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      <p className="text-xs text-gray-500">{label}</p>
      {badgeClass ? (
        <span className={cn("mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-medium", badgeClass)}>{value}</span>
      ) : (
        <p className="mt-1 text-sm font-semibold text-gray-900">{value}</p>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}

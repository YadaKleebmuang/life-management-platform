"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  BadgeCheck,
  CalendarDays,
  ClipboardList,
  Eye,
  Filter,
  Link2,
  PencilLine,
  Plus,
  ReceiptText,
  Search,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PaginationControls } from "@/components/ui/pagination";
import { formatCurrency, formatDateThai } from "@/features/finance/utils/formatters";
import { cn } from "@/lib/utils";
import { useWorkSheet } from "../hooks/useWorkSheet";
import { WorkDetailModal } from "./WorkDetailModal";
import { buildWorkSheetPreview, splitAmountEvenly } from "../utils/work-calculations";
import { usePagination } from "@/hooks/usePagination";
import type { FinancialStatus, PaymentType, WorkItem, WorkItemClientDraft, WorkItemDraft, WorkItemStatus } from "../types";

const defaultToday = new Date().toISOString().split("T")[0];

const defaultClients = (): WorkItemClientDraft[] => [
  { name: "", amount: 0 },
  { name: "", amount: 0 },
];

const defaultForm = (): WorkItemDraft => ({
  workDate: defaultToday,
  clients: defaultClients(),
  workTitle: "",
  workDetail: "",
  workLink: "",
  jobPrice: 0,
  depositType: "percentage",
  depositRate: 30,
  depositValue: 0,
  revisionCount: 0,
  revisionFee: 0,
  note: "",
  attachmentUrl: "",
  status: "open",
});

const financialStatusLabels: Record<FinancialStatus, string> = {
  unpaid: "ยังไม่จ่าย",
  partial: "จ่ายบางส่วน",
  paid: "จ่ายครบ",
  overpaid: "จ่ายเกิน",
  cancelled: "ยกเลิก",
};

const financialStatusClasses: Record<FinancialStatus, string> = {
  unpaid: "bg-gray-100 text-gray-700",
  partial: "bg-yellow-100 text-yellow-800",
  paid: "bg-green-100 text-green-800",
  overpaid: "bg-red-100 text-red-700",
  cancelled: "bg-slate-100 text-slate-600",
};

const paymentTypeLabels: Record<PaymentType, string> = {
  deposit: "มัดจำ",
  installment: "ยอดคงเหลือ",
  final: "ค่าแก้เพิ่ม",
  manual: "อื่น ๆ",
};

const toNumber = (value?: string | number | null) => Math.max(0, Number(value) || 0);

const formatWorkParticipants = (item: WorkItem) => {
  if (item.participants.length === 0) return "-";

  const names = item.participants.slice(0, 2).map((participant) => participant.name);
  const rest = item.participants.length - names.length;
  return rest > 0 ? `${names.join(", ")} +อีก ${rest} คน` : names.join(", ");
};

export function WorkSheetBoard() {
  const { items, payments, loading, error, addItem, editItem, removeItem, addPayment } = useWorkSheet();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPaymentItemId, setSelectedPaymentItemId] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedDetailItemId, setSelectedDetailItemId] = useState("");
  const [paymentType, setPaymentType] = useState<PaymentType>("installment");
  const [searchQuery, setSearchQuery] = useState("");
  const [financialFilter, setFinancialFilter] = useState<FinancialStatus | "all">("all");
  const [workDateFilter, setWorkDateFilter] = useState("");
  const [form, setForm] = useState<WorkItemDraft>(defaultForm);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(defaultToday);
  const [paymentNote, setPaymentNote] = useState("");
  const [paymentProofUrl, setPaymentProofUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [paying, setPaying] = useState(false);

  const editingItem = editingId ? items.find((item) => item.id === editingId) : null;
  const selectedPaymentItem = items.find((item) => item.id === selectedPaymentItemId) || null;
  const selectedPaymentClient = selectedPaymentItem?.clients.find((client) => client.id === selectedClientId) || null;
  const selectedDetailItem = items.find((item) => item.id === selectedDetailItemId) || null;

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return items.filter((item) => {
      const matchesQuery =
        query.length === 0 ||
        item.workTitle.toLowerCase().includes(query) ||
        (item.workDetail || "").toLowerCase().includes(query) ||
        item.participants.some((participant) => participant.name.toLowerCase().includes(query));
      const matchesFinancial = financialFilter === "all" || item.financialStatus === financialFilter;
      const matchesDate = !workDateFilter || item.workDate === workDateFilter;
      return matchesQuery && matchesFinancial && matchesDate;
    });
  }, [financialFilter, items, searchQuery, workDateFilter]);
  const workPagination = usePagination(filteredItems, 10);
  const paginatedItems = workPagination.paginatedItems;

  const totals = useMemo(
    () =>
      items.reduce(
        (acc, item) => {
          acc.jobPrice += item.jobPrice;
          acc.total += item.totalAmount;
          acc.paid += item.paidAmount;
          acc.remaining += item.remainingAmount;
          return acc;
        },
        { jobPrice: 0, total: 0, paid: 0, remaining: 0 }
      ),
    [items]
  );

  const stats = useMemo(() => {
    const activeItems = items.filter((item) => item.status !== "cancelled");
    return {
      totalJobs: items.length,
      activeJobs: activeItems.length,
      pendingJobs: activeItems.filter((item) => item.remainingAmount > 0).length,
      cancelledJobs: items.filter((item) => item.status === "cancelled").length,
    };
  }, [items]);

  const preview = useMemo(
    () =>
      buildWorkSheetPreview({
        jobPrice: form.jobPrice,
        depositType: form.depositType,
        depositRate: form.depositRate,
        depositValue: form.depositValue,
        revisionCount: form.revisionCount,
        revisionFee: form.revisionFee,
        participantCount: form.clients.length,
      }),
    [form.clients.length, form.depositRate, form.depositType, form.depositValue, form.jobPrice, form.revisionCount, form.revisionFee]
  );

  const selectedDetailPayments = selectedDetailItem ? payments[selectedDetailItem.id] || [] : [];
  const participantAmounts = preview.suggestedParticipantAmounts;

  const closeForm = () => {
    setEditingId(null);
    setForm(defaultForm());
    setIsFormOpen(false);
  };

  const openAddForm = () => {
    setEditingId(null);
    setForm(defaultForm());
    setIsFormOpen(true);
  };

  const openEditForm = (item: WorkItem) => {
    setEditingId(item.id);
    setForm({
      workDate: item.workDate,
      clients:
        item.participants.length > 0
          ? item.participants.map((participant) => ({ name: participant.name, amount: participant.amount }))
          : defaultClients(),
      workTitle: item.workTitle,
      workDetail: item.workDetail || "",
      workLink: item.workLink || "",
      jobPrice: item.jobPrice,
      depositType: item.depositType,
      depositRate: item.depositRate,
      depositValue: item.depositValue,
      revisionCount: item.revisionCount,
      revisionFee: item.revisionFee,
      note: item.note || "",
      attachmentUrl: item.attachmentUrl || "",
      status: item.status,
    });
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const workTitle = form.workTitle.trim();
    const workDate = form.workDate.trim();
    const jobPrice = toNumber(form.jobPrice);
    const clients = form.clients.map((client) => ({ name: client.name.trim(), amount: toNumber(client.amount) }));

    if (!workTitle || !workDate || jobPrice <= 0 || clients.length === 0) return;
    if (clients.some((client) => !client.name)) return;
    if (form.depositType === "percentage" && (toNumber(form.depositRate) < 0 || toNumber(form.depositRate) > 100)) return;
    if (form.depositType === "fixed" && toNumber(form.depositValue) < 0) return;

    setSaving(true);
    try {
      const splitAmounts = splitAmountEvenly(jobPrice, clients.length);
      const payload: WorkItemDraft = {
        ...form,
        workTitle,
        workDetail: form.workDetail?.trim() || undefined,
        workLink: form.workLink?.trim() || undefined,
        note: form.note?.trim() || undefined,
        attachmentUrl: form.attachmentUrl?.trim() || undefined,
        jobPrice,
        clients: clients.map((client, index) => ({
          ...client,
          amount: splitAmounts[index] ?? 0,
        })),
        depositType: form.depositType || "percentage",
        depositRate: form.depositType === "percentage" ? toNumber(form.depositRate) : 0,
        depositValue: form.depositType === "fixed" ? toNumber(form.depositValue) : 0,
        revisionCount: toNumber(form.revisionCount),
        revisionFee: toNumber(form.revisionFee),
        status: form.status,
      };

      if (editingItem) {
        await editItem(editingItem.id, payload);
      } else {
        await addItem(payload);
      }

      closeForm();
    } catch (submitError) {
      console.error("Work sheet submit failed:", submitError);
    } finally {
      setSaving(false);
    }
  };

  const handlePayment = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const amount = toNumber(paymentAmount);
    if (!selectedPaymentItem || !selectedPaymentClient || amount <= 0) return;
    if (amount > selectedPaymentClient.remainingAmount) return;

    setPaying(true);
    try {
      await addPayment(
        selectedPaymentItem.id,
        selectedPaymentClient.id,
        selectedPaymentClient.name,
        paymentType,
        amount,
        paymentDate || defaultToday,
        paymentNote.trim() || undefined,
        paymentProofUrl.trim() || undefined
      );
      setPaymentAmount("");
      setPaymentNote("");
      setPaymentProofUrl("");
      setPaymentType("installment");
      setSelectedPaymentItemId(selectedPaymentItem.id);
    } catch (paymentError) {
      console.error("Work sheet payment failed:", paymentError);
    } finally {
      setPaying(false);
    }
  };

  const canPayMore = selectedPaymentItem && selectedPaymentClient
    ? toNumber(paymentAmount) > 0 && toNumber(paymentAmount) <= selectedPaymentClient.remainingAmount
    : false;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-900 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <SummaryCard label="งานทั้งหมด" value={String(stats.totalJobs)} icon={<ClipboardList className="h-4 w-4 text-gray-400" />} />
        <SummaryCard label="ยอดรวมงานทั้งหมด" value={formatCurrency(totals.total)} icon={<Wallet className="h-4 w-4 text-gray-400" />} />
        <SummaryCard label="จ่ายแล้วทั้งหมด" value={formatCurrency(totals.paid)} valueClassName="text-green-700" icon={<ReceiptText className="h-4 w-4 text-gray-400" />} />
        <SummaryCard label="ยอดคงเหลือทั้งหมด" value={formatCurrency(totals.remaining)} valueClassName="text-red-600" icon={<BadgeCheck className="h-4 w-4 text-gray-400" />} />
        <SummaryCard label="งานที่ยังค้างจ่าย" value={String(stats.pendingJobs)} icon={<Filter className="h-4 w-4 text-gray-400" />} />
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="grid flex-1 gap-3 md:grid-cols-3">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">ค้นหา</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="ค้นหาชื่องาน, รายละเอียด, ชื่อคน" className="pl-9" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">สถานะการเงิน</label>
            <select
              value={financialFilter}
              onChange={(e) => setFinancialFilter(e.target.value as FinancialStatus | "all")}
              className="flex h-10 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
            >
              <option value="all">ทั้งหมด</option>
              <option value="unpaid">ยังไม่จ่าย</option>
              <option value="partial">จ่ายบางส่วน</option>
              <option value="paid">จ่ายครบ</option>
              <option value="overpaid">จ่ายเกิน</option>
              <option value="cancelled">ยกเลิก</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">วันที่</label>
            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input type="date" value={workDateFilter} onChange={(e) => setWorkDateFilter(e.target.value)} className="pl-9" />
            </div>
          </div>
        </div>
        <Button onClick={openAddForm} className="shrink-0">
          <Plus className="mr-2 h-4 w-4" />
          เพิ่มงานใหม่
        </Button>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4">
          <div className="mx-auto my-8 w-full max-w-5xl">
            <Card className="border-gray-200 shadow-xl">
              <CardHeader className="flex flex-row items-start justify-between gap-4 border-b border-gray-100">
                <div>
                  <CardTitle>{editingItem ? "แก้ไขรายการงาน" : "เพิ่มงานใหม่"}</CardTitle>
                  <CardDescription>แบ่งเป็น 4 กลุ่มตามที่ต้องการ พร้อมคำนวณยอดให้ทันที</CardDescription>
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={closeForm}>
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                {error && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <section className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-900">1. ข้อมูลงาน</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <Field label="วันที่รับงาน *">
                        <Input type="date" value={form.workDate} onChange={(e) => setForm((prev) => ({ ...prev, workDate: e.target.value }))} required />
                      </Field>
                      <Field label="สถานะงาน">
                        <select
                          value={form.status}
                          onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as WorkItemStatus }))}
                          className="flex h-10 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
                        >
                          <option value="open">รอดำเนินการ</option>
                          <option value="in_progress">กำลังทำ</option>
                          <option value="partially_paid">ส่งงานแล้ว</option>
                          <option value="paid">เสร็จสิ้น</option>
                          <option value="cancelled">ยกเลิก</option>
                        </select>
                      </Field>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-medium text-gray-700">ชื่องาน *</label>
                        <Input value={form.workTitle} onChange={(e) => setForm((prev) => ({ ...prev, workTitle: e.target.value }))} placeholder="เช่น ออกแบบโปสเตอร์" required />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-medium text-gray-700">รายละเอียดงาน</label>
                        <textarea
                          value={form.workDetail || ""}
                          onChange={(e) => setForm((prev) => ({ ...prev, workDetail: e.target.value }))}
                          className="min-h-24 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
                          placeholder="รายละเอียดเพิ่มเติมของงาน"
                        />
                      </div>
                    </div>
                  </section>

                  <section className="space-y-4 rounded-2xl border border-gray-200 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">2. ลูกค้า / ผู้หารเงิน</h3>
                        <p className="mt-1 text-xs text-gray-500">จำนวนคนที่หารเงิน {form.clients.length} คน</p>
                      </div>
                      <Button type="button" variant="outline" onClick={() => setForm((prev) => ({ ...prev, clients: [...prev.clients, { name: "", amount: 0 }] }))}>
                        <Plus className="mr-2 h-4 w-4" />
                        เพิ่มคน
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {form.clients.map((client, index) => (
                        <div key={index} className="grid gap-3 md:grid-cols-[1fr_180px_auto]">
                          <Input value={client.name} onChange={(e) => setForm((prev) => updateParticipantDraft(prev, index, { name: e.target.value }))} placeholder={`ชื่อคนที่ ${index + 1}`} required />
                          <Input value={formatCurrency(participantAmounts[index] ?? 0)} readOnly className="bg-gray-50" />
                          <Button type="button" variant="ghost" size="icon" onClick={() => setForm((prev) => removeParticipantDraft(prev, index))} disabled={form.clients.length <= 1}>
                            <Trash2 className="h-4 w-4 text-gray-400" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
                    <div className="space-y-4 rounded-2xl border border-gray-200 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h3 className="text-sm font-semibold text-gray-900">3. ราคาและการคำนวณ</h3>
                        <div className="flex rounded-full border border-gray-200 p-1">
                          <Button type="button" variant={form.depositType === "percentage" ? "default" : "ghost"} className="h-8 px-3 text-xs" onClick={() => setForm((prev) => ({ ...prev, depositType: "percentage" }))}>
                            เปอร์เซ็นต์
                          </Button>
                          <Button type="button" variant={form.depositType === "fixed" ? "default" : "ghost"} className="h-8 px-3 text-xs" onClick={() => setForm((prev) => ({ ...prev, depositType: "fixed" }))}>
                            จำนวนเงิน
                          </Button>
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <Field label="ราคางานทั้งหมด *">
                          <Input type="number" min="0.01" step="0.01" value={form.jobPrice} onChange={(e) => setForm((prev) => ({ ...prev, jobPrice: Number(e.target.value) }))} placeholder="0.00" required />
                        </Field>
                        <Field label={form.depositType === "fixed" ? "มัดจำ (บาท)" : "มัดจำ (%)"}>
                          <Input
                            type="number"
                            min="0"
                            max={form.depositType === "percentage" ? 100 : undefined}
                            step="0.01"
                            value={form.depositType === "fixed" ? form.depositValue : form.depositRate}
                            onChange={(e) =>
                              setForm((prev) =>
                                prev.depositType === "fixed"
                                  ? { ...prev, depositValue: Number(e.target.value), depositRate: 0 }
                                  : { ...prev, depositRate: Number(e.target.value), depositValue: 0 }
                              )
                            }
                            placeholder={form.depositType === "fixed" ? "0.00" : "30"}
                            required
                          />
                        </Field>
                        <Field label="จำนวนรอบแก้ฟรี">
                          <Input type="number" min="0" step="1" value={form.revisionCount} onChange={(e) => setForm((prev) => ({ ...prev, revisionCount: Number(e.target.value) }))} required />
                        </Field>
                        <Field label="ค่าแก้เพิ่มต่อรอบ">
                          <Input type="number" min="0" step="0.01" value={form.revisionFee} onChange={(e) => setForm((prev) => ({ ...prev, revisionFee: Number(e.target.value) }))} required />
                        </Field>
                      </div>

                      <div className="grid gap-3 md:grid-cols-4">
                        <MetricTile label="ราคาต่อคน" value={formatCurrency(preview.pricePerParticipant)} />
                        <MetricTile label="มัดจำรวม" value={formatCurrency(preview.depositAmount)} />
                        <MetricTile label="มัดจำต่อคน" value={formatCurrency(preview.depositPerParticipant)} />
                        <MetricTile label="ยอดคงเหลือต่อคน" value={formatCurrency(preview.remainingPerParticipant)} />
                        <MetricTile label="ยอดคงเหลือรวม" value={formatCurrency(preview.remainingAfterDeposit)} />
                        <MetricTile label="ยอดรวมทั้งหมด" value={formatCurrency(preview.totalAmount)} />
                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 md:col-span-2">
                          <p className="text-xs text-gray-500">สถานะการเงิน</p>
                          <p className="mt-1 text-lg font-semibold text-gray-900">{financialStatusLabels[preview.financialStatus]}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 rounded-2xl border border-gray-200 p-4">
                      <h3 className="text-sm font-semibold text-gray-900">4. ไฟล์และลิงก์</h3>
                      <Field label="ลิงก์งาน">
                        <Input value={form.workLink || ""} onChange={(e) => setForm((prev) => ({ ...prev, workLink: e.target.value }))} placeholder="https://..." />
                      </Field>
                      <Field label="รูปภาพหรือไฟล์แนบ">
                        <Input value={form.attachmentUrl || ""} onChange={(e) => setForm((prev) => ({ ...prev, attachmentUrl: e.target.value }))} placeholder="https://..." />
                      </Field>
                      <Field label="หมายเหตุเพิ่มเติม">
                        <Input value={form.note || ""} onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))} placeholder="เช่น นัดจ่ายวันไหน" />
                      </Field>
                    </div>
                  </section>

                  <div className="flex items-center justify-end gap-2">
                    {editingItem && (
                      <Button type="button" variant="outline" onClick={closeForm}>
                        ยกเลิกแก้ไข
                      </Button>
                    )}
                    <Button type="submit" disabled={saving}>
                      <Plus className="mr-2 h-4 w-4" />
                      {saving ? "กำลังบันทึก..." : editingItem ? "บันทึกการแก้ไข" : "บันทึกงาน"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {selectedDetailItem && <WorkDetailModal item={selectedDetailItem} payments={selectedDetailPayments} onClose={() => setSelectedDetailItemId("")} />}

      <Card>
        <CardHeader className="space-y-2">
          <CardTitle className="text-base">บันทึกการจ่าย</CardTitle>
          <CardDescription>เลือกงาน แล้วเลือกคนที่ต้องการบันทึกการจ่ายของคนนั้น</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePayment} className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <Field label="เลือกงาน">
                <select
                  value={selectedPaymentItemId}
                  onChange={(e) => {
                    setSelectedPaymentItemId(e.target.value);
                    setSelectedClientId("");
                    setPaymentType("installment");
                    setPaymentAmount("");
                    setPaymentNote("");
                    setPaymentProofUrl("");
                  }}
                  className="flex h-10 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
                  required
                >
                  <option value="">เลือกงานที่ต้องการจ่าย</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.workTitle}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="เลือกคน">
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="flex h-10 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
                  required
                >
                  <option value="">เลือกคนที่ต้องการจ่าย</option>
                  {selectedPaymentItem?.clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            {selectedPaymentItem && selectedPaymentClient && (
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                <div className="font-medium text-gray-900">{selectedPaymentItem.workTitle}</div>
                <div className="mt-1 text-gray-600">{selectedPaymentClient.name}</div>
                <div className="mt-2 flex flex-wrap gap-3">
                  <span>ยอดคนนี้ {formatCurrency(selectedPaymentClient.amount)}</span>
                  <span>จ่ายแล้ว {formatCurrency(selectedPaymentClient.paidAmount)}</span>
                  <span>คงเหลือ {formatCurrency(selectedPaymentClient.remainingAmount)}</span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">ประเภทการจ่าย</label>
              <div className="grid gap-2 md:grid-cols-4">
                {(["deposit", "installment", "final", "manual"] as PaymentType[]).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setPaymentType(option)}
                    className={cn(
                      "rounded-xl border px-3 py-2 text-sm transition-colors",
                      paymentType === option ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                    )}
                  >
                    {paymentTypeLabels[option]}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="จำนวนเงิน">
                <Input type="number" min="0.01" step="0.01" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} placeholder="0.00" required />
              </Field>
              <Field label="วันที่จ่าย">
                <Input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} required />
              </Field>
            </div>

            <Field label="ลิงก์สลิปหรือหลักฐานการโอน">
              <Input value={paymentProofUrl} onChange={(e) => setPaymentProofUrl(e.target.value)} placeholder="https://..." />
            </Field>

            <Field label="หมายเหตุการจ่าย">
              <Input value={paymentNote} onChange={(e) => setPaymentNote(e.target.value)} placeholder="เช่น โอนแล้ว" />
            </Field>

            <div className="flex items-center justify-end gap-2">
              {selectedPaymentClient && toNumber(paymentAmount) > selectedPaymentClient.remainingAmount && (
                <p className="mr-auto text-xs text-red-600">ยอดจ่ายเกินยอดคงเหลือของคนนี้</p>
              )}
              <Button type="submit" disabled={paying || !canPayMore}>
                <ReceiptText className="mr-2 h-4 w-4" />
                {paying ? "กำลังบันทึก..." : "บันทึกการจ่าย"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-2">
          <CardTitle className="text-base">รายการงานทั้งหมด</CardTitle>
          <CardDescription>
            แสดง {filteredItems.length} รายการจากทั้งหมด {items.length} รายการ
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="lg:hidden space-y-3">
            {paginatedItems.length === 0 ? (
              <EmptyState />
            ) : (
              paginatedItems.map((item) => <WorkCard key={item.id} item={item} onView={() => setSelectedDetailItemId(item.id)} onPay={() => openPaymentTarget(item)} onEdit={() => openEditForm(item)} onDelete={() => removeItem(item.id)} />)
            )}
          </div>

          <div className="hidden lg:block">
            {paginatedItems.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="overflow-hidden rounded-2xl border border-gray-200">
                <table className="w-full table-fixed text-left text-sm">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                    <tr>
                      <Th>วันที่</Th>
                      <Th>ชื่องาน</Th>
                      <Th>ลูกค้า/ผู้หาร</Th>
                      <Th className="text-right">ราคางาน</Th>
                      <Th className="text-right">จ่ายแล้ว</Th>
                      <Th className="text-right">คงเหลือ</Th>
                      <Th>สถานะการเงิน</Th>
                      <Th className="text-center">จัดการ</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {paginatedItems.map((item) => (
                      <tr key={item.id} className="align-top hover:bg-gray-50/60">
                        <Td>{item.workDate ? formatDateThai(item.workDate) : "-"}</Td>
                        <Td>
                          <div className="space-y-1">
                            <div className="font-medium text-gray-900">{item.workTitle}</div>
                            <div className="text-xs text-gray-500 line-clamp-2">{item.workDetail || "-"}</div>
                          </div>
                        </Td>
                        <Td>
                          <div className="space-y-1">
                            <div className="font-medium text-gray-900">{formatWorkParticipants(item)}</div>
                            <div className="text-xs text-gray-500">{item.participantCount} คน</div>
                          </div>
                        </Td>
                        <Td className="text-right font-medium text-gray-900">{formatCurrency(item.jobPrice)}</Td>
                        <Td className="text-right font-medium text-green-700">{formatCurrency(item.paidAmount)}</Td>
                        <Td className="text-right font-medium text-red-600">{formatCurrency(item.remainingAmount)}</Td>
                        <Td>
                          <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-medium", financialStatusClasses[item.financialStatus])}>
                            {financialStatusLabels[item.financialStatus]}
                          </span>
                        </Td>
                        <Td>
                          <div className="flex items-center justify-center gap-1">
                            <IconButton label="ดูรายละเอียด" onClick={() => setSelectedDetailItemId(item.id)}>
                              <Eye className="h-4 w-4" />
                            </IconButton>
                            <IconButton label="บันทึกจ่าย" onClick={() => openPaymentTarget(item)}>
                              <Wallet className="h-4 w-4" />
                            </IconButton>
                            <IconButton label="แก้ไข" onClick={() => openEditForm(item)}>
                              <PencilLine className="h-4 w-4" />
                            </IconButton>
                            <IconButton label="ลบ" onClick={() => removeItem(item.id)}>
                              <Trash2 className="h-4 w-4" />
                            </IconButton>
                          </div>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <PaginationControls
            currentPage={workPagination.currentPage}
            totalPages={workPagination.totalPages}
            totalItems={workPagination.totalItems}
            pageSize={workPagination.pageSize}
            startItem={workPagination.startItem}
            endItem={workPagination.endItem}
            onPageChange={workPagination.setCurrentPage}
            label="รายการงาน"
          />
        </CardContent>
      </Card>
    </div>
  );

  function openPaymentTarget(item: WorkItem) {
    setSelectedPaymentItemId(item.id);
    setSelectedClientId(item.clients[0]?.id || "");
    setPaymentAmount("");
    setPaymentNote("");
    setPaymentProofUrl("");
    setPaymentType("installment");
  }
}

function updateParticipantDraft(
  form: WorkItemDraft,
  index: number,
  patch: Partial<WorkItemClientDraft>
): WorkItemDraft {
  const nextClients = [...form.clients];
  nextClients[index] = { ...nextClients[index], ...patch };
  return { ...form, clients: nextClients };
}

function removeParticipantDraft(form: WorkItemDraft, index: number): WorkItemDraft {
  if (form.clients.length <= 1) return form;
  return { ...form, clients: form.clients.filter((_, currentIndex) => currentIndex !== index) };
}

function SummaryCard({
  label,
  value,
  valueClassName,
  icon,
}: {
  label: string;
  value: string;
  valueClassName?: string;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-gray-500">{label}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className={cn("text-2xl font-semibold text-gray-900", valueClassName)}>{value}</div>
      </CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      {children}
    </div>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function EmptyState() {
  return <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-500">ยังไม่พบรายการที่ตรงกับตัวกรอง</div>;
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={cn("px-4 py-3 font-semibold", className)}>{children}</th>;
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={cn("px-4 py-4 align-top text-gray-700", className)}>{children}</td>;
}

function IconButton({ children, onClick, label }: { children: React.ReactNode; onClick: () => void; label: string }) {
  return (
    <Button type="button" variant="ghost" size="icon" onClick={onClick} title={label} aria-label={label}>
      {children}
    </Button>
  );
}

function WorkCard({
  item,
  onView,
  onPay,
  onEdit,
  onDelete,
}: {
  item: WorkItem;
  onView: () => void;
  onPay: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className="border-gray-200">
      <CardContent className="space-y-4 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="text-xs text-gray-500">{item.workDate ? formatDateThai(item.workDate) : "-"}</div>
            <div className="font-medium text-gray-900">{item.workTitle}</div>
            <div className="text-xs text-gray-500">{formatWorkParticipants(item)}</div>
          </div>
          <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-medium", financialStatusClasses[item.financialStatus])}>
            {financialStatusLabels[item.financialStatus]}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="rounded-xl bg-gray-50 p-3">
            <p className="text-xs text-gray-500">ราคา</p>
            <p className="mt-1 font-semibold text-gray-900">{formatCurrency(item.jobPrice)}</p>
          </div>
          <div className="rounded-xl bg-gray-50 p-3">
            <p className="text-xs text-gray-500">จ่ายแล้ว</p>
            <p className="mt-1 font-semibold text-green-700">{formatCurrency(item.paidAmount)}</p>
          </div>
          <div className="rounded-xl bg-gray-50 p-3">
            <p className="text-xs text-gray-500">คงเหลือ</p>
            <p className="mt-1 font-semibold text-red-600">{formatCurrency(item.remainingAmount)}</p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {item.workLink && (
              <a href={item.workLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-gray-700 hover:underline">
                <Link2 className="h-3.5 w-3.5" />
                ลิงก์งาน
              </a>
            )}
            {item.attachmentUrl && (
              <a href={item.attachmentUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-gray-700 hover:underline">
                <Link2 className="h-3.5 w-3.5" />
                ไฟล์แนบ
              </a>
            )}
          </div>
          <div className="flex items-center gap-1">
            <IconButton label="ดูรายละเอียด" onClick={onView}>
              <Eye className="h-4 w-4" />
            </IconButton>
            <IconButton label="บันทึกจ่าย" onClick={onPay}>
              <Wallet className="h-4 w-4" />
            </IconButton>
            <IconButton label="แก้ไข" onClick={onEdit}>
              <PencilLine className="h-4 w-4" />
            </IconButton>
            <IconButton label="ลบ" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </IconButton>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

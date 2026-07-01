"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import {
  BadgeCheck,
  ArrowRightLeft,
  CalendarDays,
  ClipboardList,
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
import { useAuth } from "@/features/auth/contexts/AuthContext";
import { useAccounts } from "@/features/finance/hooks/useAccounts";
import { useCategories } from "@/features/finance/hooks/useCategories";
import { useFinanceData } from "@/features/finance/hooks/useFinanceData";
import { useTransfers } from "@/features/finance/hooks/useTransfers";
import { deleteTransfer } from "@/features/finance/services/transferService";
import { calculateTransactionSummary } from "@/features/finance/utils/finance-calculations";
import { formatCurrency, formatDateThai } from "@/features/finance/utils/formatters";
import { notifyFinanceChanged } from "@/features/finance/utils/financeEvents";
import { cn } from "@/lib/utils";
import type { Expense, Income, Transfer } from "@/features/finance/types";

type TransactionTab = "all" | "income" | "expense" | "transfer";
type TransactionKind = Exclude<TransactionTab, "all">;
type TransactionMode = "create" | "edit";

type TransactionFormState = {
  type: TransactionKind;
  date: string;
  title: string;
  amount: string;
  accountId: string;
  categoryId: string;
  usageDays: string;
  note: string;
  fromAccountId: string;
  toAccountId: string;
};

type UnifiedTransactionRow = {
  id: string;
  type: TransactionKind;
  date: string;
  createdAt: string;
  title: string;
  amount: number;
  note?: string;
  accountId?: string;
  accountLabel: string;
  categoryId?: string;
  categoryLabel: string;
  transferFromAccountId?: string;
  transferToAccountId?: string;
  transferFromAccountLabel?: string;
  transferToAccountLabel?: string;
  canEdit: boolean;
};

const defaultToday = new Date().toISOString().split("T")[0];

const tabLabels: Record<TransactionTab, string> = {
  all: "ทั้งหมด",
  income: "รายรับ",
  expense: "รายจ่าย",
  transfer: "โอนเงิน",
};

const transactionTypeOptions: Array<{ value: TransactionTab; label: string }> = [
  { value: "all", label: "ทั้งหมด" },
  { value: "income", label: "รายรับ" },
  { value: "expense", label: "รายจ่าย" },
  { value: "transfer", label: "โอนเงิน" },
];

const transactionTypePills: Array<{ value: TransactionKind; label: string }> = [
  { value: "income", label: "รายรับ" },
  { value: "expense", label: "รายจ่าย" },
  { value: "transfer", label: "โอนเงิน" },
];

const selectClassName =
  "flex h-10 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900";

function buildDefaultForm(type: TransactionKind = "income"): TransactionFormState {
  return {
    type,
    date: defaultToday,
    title: "",
    amount: "",
    accountId: "",
    categoryId: "",
    usageDays: "30",
    note: "",
    fromAccountId: "",
    toAccountId: "",
  };
}

function getCategoryValue(type: TransactionKind, categoryId: string) {
  return `${type}:${categoryId}`;
}

export function TransactionManagementBoard() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const initialTab = normalizeTab(searchParams.get("type") ?? searchParams.get("tab"));

  const { incomes, expenses, addIncome, updateIncome, removeIncome, addExpense, updateExpense, removeExpense, loading: financeLoading } =
    useFinanceData();
  const { transfers, addTransfer, refreshTransfers, loading: transfersLoading } = useTransfers();
  const { activeAccounts, loading: accountsLoading } = useAccounts();
  const { activeIncomeCategories, activeExpenseCategories, loading: categoriesLoading } = useCategories();

  const [transactionTab, setTransactionTab] = useState<TransactionTab>(initialTab);
  const [searchQuery, setSearchQuery] = useState("");
  const [accountFilter, setAccountFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mode, setMode] = useState<TransactionMode>("create");
  const [editingRow, setEditingRow] = useState<UnifiedTransactionRow | null>(null);
  const [form, setForm] = useState<TransactionFormState>(() => buildDefaultForm(initialTab === "all" ? "income" : initialTab));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const accountNameMap = useMemo(() => {
    const map = new Map<string, string>();
    activeAccounts.forEach((account) => {
      map.set(account.id, account.accountName);
    });
    return map;
  }, [activeAccounts]);

  const incomeCategoryMap = useMemo(() => {
    const map = new Map<string, string>();
    activeIncomeCategories.forEach((category) => {
      map.set(category.id, category.name);
    });
    return map;
  }, [activeIncomeCategories]);

  const expenseCategoryMap = useMemo(() => {
    const map = new Map<string, string>();
    activeExpenseCategories.forEach((category) => {
      map.set(category.id, category.name);
    });
    return map;
  }, [activeExpenseCategories]);

  const categoryOptions = useMemo(
    () => [
      ...activeIncomeCategories.map((category) => ({
        value: getCategoryValue("income", category.id),
        label: `รายรับ • ${category.name}`,
      })),
      ...activeExpenseCategories.map((category) => ({
        value: getCategoryValue("expense", category.id),
        label: `รายจ่าย • ${category.name}`,
      })),
    ],
    [activeExpenseCategories, activeIncomeCategories]
  );

  const rows = useMemo<UnifiedTransactionRow[]>(() => {
    const incomeRows = incomes.map((income) => ({
      id: income.id,
      type: "income" as const,
      date: income.date,
      createdAt: income.createdAt,
      title: income.title,
      amount: income.amount,
      note: income.note,
      accountId: income.accountId,
      accountLabel: accountNameMap.get(income.accountId) || "ไม่ระบุบัญชี",
      categoryId: income.categoryId,
      categoryLabel: getIncomeCategoryLabel(income, incomeCategoryMap),
      canEdit: true,
    }));

    const expenseRows = expenses.map((expense) => ({
      id: expense.id,
      type: "expense" as const,
      date: expense.date,
      createdAt: expense.createdAt,
      title: expense.title,
      amount: expense.amount,
      note: expense.note,
      accountId: expense.accountId,
      accountLabel: accountNameMap.get(expense.accountId) || "ไม่ระบุบัญชี",
      categoryId: expense.categoryId,
      categoryLabel: getExpenseCategoryLabel(expense, expenseCategoryMap),
      canEdit: true,
    }));

    const transferRows = transfers.map((transfer) => ({
      id: transfer.id,
      type: "transfer" as const,
      date: transfer.transferDate,
      createdAt: transfer.createdAt,
      title: transfer.note?.trim() || "โอนเงินระหว่างบัญชี",
      amount: transfer.amount,
      note: transfer.note,
      accountId: transfer.fromAccountId,
      accountLabel: `${accountNameMap.get(transfer.fromAccountId) || "ไม่ระบุบัญชี"} → ${accountNameMap.get(transfer.toAccountId) || "ไม่ระบุบัญชี"}`,
      categoryLabel: "-",
      transferFromAccountId: transfer.fromAccountId,
      transferToAccountId: transfer.toAccountId,
      transferFromAccountLabel: accountNameMap.get(transfer.fromAccountId) || "ไม่ระบุบัญชี",
      transferToAccountLabel: accountNameMap.get(transfer.toAccountId) || "ไม่ระบุบัญชี",
      canEdit: false,
    }));

    return [...incomeRows, ...expenseRows, ...transferRows].sort((a, b) => {
      const dateDiff = b.date.localeCompare(a.date);
      if (dateDiff !== 0) return dateDiff;
      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [accountNameMap, expenseCategoryMap, expenses, incomes, incomeCategoryMap, transfers]);

  const summary = useMemo(() => calculateTransactionSummary(incomes, expenses, transfers), [expenses, incomes, transfers]);

  const filteredRows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesTab = transactionTab === "all" || row.type === transactionTab;
      const matchesSearch =
        !query ||
        row.title.toLowerCase().includes(query) ||
        (row.note || "").toLowerCase().includes(query) ||
        row.accountLabel.toLowerCase().includes(query) ||
        row.categoryLabel.toLowerCase().includes(query) ||
        (row.transferFromAccountLabel || "").toLowerCase().includes(query) ||
        (row.transferToAccountLabel || "").toLowerCase().includes(query);
      const matchesAccount =
        !accountFilter ||
        row.accountId === accountFilter ||
        row.transferFromAccountId === accountFilter ||
        row.transferToAccountId === accountFilter;
      const matchesCategory =
        transactionTab === "transfer"
          ? true
          : !categoryFilter ||
            (row.categoryId ? getCategoryValue(row.type, row.categoryId) === categoryFilter : false);
      const matchesDateFrom = !dateFrom || row.date >= dateFrom;
      const matchesDateTo = !dateTo || row.date <= dateTo;

      return matchesTab && matchesSearch && matchesAccount && matchesCategory && matchesDateFrom && matchesDateTo;
    });
  }, [accountFilter, categoryFilter, dateFrom, dateTo, rows, searchQuery, transactionTab]);

  const openCreateModal = (type?: TransactionKind) => {
    const nextType = type ?? (transactionTab === "all" ? "income" : transactionTab);
    setMode("create");
    setEditingRow(null);
    setForm(buildDefaultForm(nextType));
    setError("");
    setIsModalOpen(true);
  };

  const openEditModal = (row: UnifiedTransactionRow) => {
    if (row.type === "transfer") return;

    setMode("edit");
    setEditingRow(row);
    setForm({
      type: row.type,
      date: row.date,
      title: row.title,
      amount: String(row.amount),
      accountId: row.accountId || "",
      categoryId: row.categoryId || "",
      usageDays: row.type === "income" ? String(incomes.find((item) => item.id === row.id)?.usageDays ?? 30) : "30",
      note: row.note || "",
      fromAccountId: "",
      toAccountId: "",
    });
    setError("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setMode("create");
    setEditingRow(null);
    setError("");
    setForm(buildDefaultForm(transactionTab === "all" ? "income" : transactionTab));
  };

  const handleTypeChange = (nextType: TransactionKind) => {
    setForm((prev) => ({
      ...buildDefaultForm(nextType),
      date: prev.date,
      title: nextType === "transfer" ? "" : prev.title,
      amount: prev.amount,
      accountId: nextType === "transfer" ? "" : prev.accountId,
      categoryId: "",
      usageDays: nextType === "income" ? prev.usageDays || "30" : "30",
      note: prev.note,
      fromAccountId: prev.fromAccountId,
      toAccountId: prev.toAccountId,
    }));
    setError("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const title = form.title.trim();
    const note = form.note.trim();
    const amount = Number(form.amount) || 0;

    if (!form.date.trim()) {
      setError("กรุณาเลือกวันที่");
      return;
    }

    if ((form.type === "income" || form.type === "expense") && !title) {
      setError("กรุณากรอกชื่อรายการ");
      return;
    }

    if (amount <= 0) {
      setError("จำนวนเงินต้องมากกว่า 0");
      return;
    }

    setSaving(true);
    setError("");

    try {
      if (form.type === "income") {
        if (!form.accountId) {
          setError("กรุณาเลือกบัญชีรับเงิน");
          return;
        }

        if (!form.categoryId) {
          setError("กรุณาเลือกหมวดหมู่รายรับ");
          return;
        }

        const category = activeIncomeCategories.find((item) => item.id === form.categoryId);
        const source = category?.name || "Other";
        const payload: Omit<Income, "id" | "createdAt"> = {
          date: form.date.trim(),
          title,
          amount,
          source,
          accountId: form.accountId,
          categoryId: form.categoryId || undefined,
          usageDays: Math.max(1, Number.parseInt(form.usageDays, 10) || 30),
          note: note || undefined,
        };

        if (mode === "edit" && editingRow) {
          const existing = incomes.find((item) => item.id === editingRow.id);
          if (!existing) throw new Error("ไม่พบข้อมูลรายรับเดิม");
          await updateIncome({
            ...existing,
            ...payload,
            id: existing.id,
            createdAt: existing.createdAt,
            usageDays: existing.usageDays || 30,
          });
        } else {
          await addIncome(payload);
        }
      } else if (form.type === "expense") {
        if (!form.accountId) {
          setError("กรุณาเลือกบัญชีจ่ายเงิน");
          return;
        }

        if (!form.categoryId) {
          setError("กรุณาเลือกหมวดหมู่รายจ่าย");
          return;
        }

        const category = activeExpenseCategories.find((item) => item.id === form.categoryId);
        const expenseCategory = category?.name || "Other";
        const payload: Omit<Expense, "id" | "createdAt"> = {
          date: form.date.trim(),
          title,
          amount,
          category: expenseCategory,
          accountId: form.accountId,
          categoryId: form.categoryId || undefined,
          note: note || undefined,
        };

        if (mode === "edit" && editingRow) {
          const existing = expenses.find((item) => item.id === editingRow.id);
          if (!existing) throw new Error("ไม่พบข้อมูลรายจ่ายเดิม");
          await updateExpense({
            ...existing,
            ...payload,
            id: existing.id,
            createdAt: existing.createdAt,
          });
        } else {
          await addExpense(payload);
        }
      } else {
        if (!form.fromAccountId || !form.toAccountId) {
          setError("กรุณาเลือกบัญชีต้นทางและบัญชีปลายทาง");
          return;
        }

        if (form.fromAccountId === form.toAccountId) {
          setError("บัญชีต้นทางและปลายทางต้องไม่ใช่บัญชีเดียวกัน");
          return;
        }

        const sourceAccount = activeAccounts.find((account) => account.id === form.fromAccountId);
        if (!sourceAccount) {
          setError("ไม่พบบัญชีต้นทาง");
          return;
        }

        if (sourceAccount.currentBalance < amount) {
          setError("จำนวนเงินโอนเกินยอดคงเหลือของบัญชีต้นทาง");
          return;
        }

        const payload: Omit<Transfer, "id" | "userId" | "createdAt"> = {
          fromAccountId: form.fromAccountId,
          toAccountId: form.toAccountId,
          amount,
          transferDate: form.date.trim(),
          note: note || undefined,
        };

        await addTransfer(payload);
      }

      closeModal();
      notifyFinanceChanged();
    } catch (submitError) {
      console.error("Failed to save transaction:", submitError);
      setError(submitError instanceof Error ? submitError.message : "ไม่สามารถบันทึกรายการได้");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row: UnifiedTransactionRow) => {
    try {
      if (row.type === "income") {
        const record = incomes.find((item) => item.id === row.id);
        if (record) {
          await removeIncome(record);
        }
        return;
      }

      if (row.type === "expense") {
        const record = expenses.find((item) => item.id === row.id);
        if (record) {
          await removeExpense(record);
        }
        return;
      }

      if (!user?.uid) return;
      await deleteTransfer(user.uid, row.id);
      await refreshTransfers();
      notifyFinanceChanged();
    } catch (deleteError) {
      console.error("Failed to delete transaction:", deleteError);
    }
  };

  const loading = financeLoading || transfersLoading || accountsLoading || categoriesLoading;

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
        <SummaryCard label="รายรับรวม" value={formatCurrency(summary.incomeTotal)} icon={<Wallet className="h-4 w-4 text-gray-400" />} />
        <SummaryCard label="รายจ่ายรวม" value={formatCurrency(summary.expenseTotal)} icon={<ReceiptText className="h-4 w-4 text-gray-400" />} />
        <SummaryCard label="คงเหลือสุทธิ" value={formatCurrency(summary.netTotal)} valueClassName={summary.netTotal >= 0 ? "text-green-700" : "text-red-600"} icon={<BadgeCheck className="h-4 w-4 text-gray-400" />} />
        <SummaryCard label="ยอดโอนรวม" value={formatCurrency(summary.transferTotal)} icon={<ArrowRightLeft className="h-4 w-4 text-gray-400" />} />
        <SummaryCard label="จำนวนรายการทั้งหมด" value={String(summary.itemCount)} icon={<ClipboardList className="h-4 w-4 text-gray-400" />} />
      </div>

      <Card className="border-gray-200 bg-white shadow-sm">
        <CardHeader className="space-y-2 border-b border-gray-100 pb-5">
          <CardTitle className="text-base">ตัวกรองและการค้นหา</CardTitle>
          <CardDescription>ค้นหาและกรองรายการรายรับ รายจ่าย และการโอนเงินได้จากจุดเดียว</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 pt-5">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,0.85fr)_minmax(0,0.9fr)_minmax(0,1fr)_minmax(0,1.2fr)_auto]">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">ค้นหารายการ</label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="ค้นหาชื่อ, หมายเหตุ, บัญชี" className="pl-9" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">ประเภท</label>
              <select value={transactionTab} onChange={(event) => setTransactionTab(event.target.value as TransactionTab)} className={selectClassName}>
                {transactionTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">บัญชี</label>
              <select value={accountFilter} onChange={(event) => setAccountFilter(event.target.value)} className={selectClassName}>
                <option value="">ทั้งหมด</option>
                {activeAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.accountName}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">หมวดหมู่</label>
              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                className={selectClassName}
                disabled={transactionTab === "transfer"}
              >
                <option value="">ทั้งหมด</option>
                {categoryOptions.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">ช่วงวันที่</label>
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="pl-9" />
                </div>
                <Input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
              </div>
            </div>

            <div className="flex items-end">
              <Button type="button" onClick={() => openCreateModal()} className="w-full lg:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                เพิ่มรายการ
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-4">
            {transactionTypePills.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setTransactionTab(option.value)}
                className={cn(
                  "rounded-xl border px-3.5 py-2 text-sm font-medium transition-colors",
                  transactionTab === option.value ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4">
          <div className="mx-auto my-8 w-full max-w-4xl">
            <Card className="border-gray-200 shadow-xl">
              <CardHeader className="flex flex-row items-start justify-between gap-4 border-b border-gray-100 pb-5">
                <div className="space-y-1">
                  <CardTitle>{mode === "edit" ? "แก้ไขรายการ" : "เพิ่มรายการใหม่"}</CardTitle>
                  <CardDescription>เลือกประเภทก่อน แล้วกรอกข้อมูลของรายการนั้น</CardDescription>
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={closeModal}>
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">ประเภทรายการ</label>
                  <div className="grid gap-2 md:grid-cols-3">
                    {transactionTypePills.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => mode === "create" && handleTypeChange(option.value)}
                        disabled={mode === "edit" && form.type !== option.value}
                        className={cn(
                          "rounded-xl border px-4 py-3 text-sm font-medium transition-colors",
                          form.type === option.value ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 bg-white text-gray-700 hover:border-gray-400",
                          mode === "edit" ? "cursor-default" : ""
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {error && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {form.type === "income" && (
                    <div className="space-y-4">
                      <FormGrid>
                        <Field label="วันที่">
                          <Input type="date" value={form.date} onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))} required />
                        </Field>
                        <Field label="ชื่อรายการ *">
                          <Input value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} placeholder="เช่น เงินเดือน, ค่าจ้าง" required />
                        </Field>
                        <Field label="จำนวนเงิน (บาท) *">
                          <Input type="number" min="0" step="0.01" value={form.amount} onChange={(event) => setForm((prev) => ({ ...prev, amount: event.target.value }))} placeholder="0.00" required />
                        </Field>
                        <Field label="บัญชีรับเงิน *">
                          <select value={form.accountId} onChange={(event) => setForm((prev) => ({ ...prev, accountId: event.target.value }))} className={selectClassName} required>
                            <option value="">เลือกบัญชี</option>
                            {activeAccounts.map((account) => (
                              <option key={account.id} value={account.id}>
                                {account.accountName}
                              </option>
                            ))}
                          </select>
                        </Field>
                        <Field label="หมวดหมู่รายรับ">
                          <select value={form.categoryId} onChange={(event) => setForm((prev) => ({ ...prev, categoryId: event.target.value }))} className={selectClassName}>
                            <option value="">เลือกหมวดหมู่รายรับ</option>
                            {activeIncomeCategories.map((category) => (
                              <option key={category.id} value={category.id}>
                                {category.name}
                              </option>
                            ))}
                          </select>
                        </Field>
                        <Field label="จำนวนวันที่จะใช้เงินก้อนนี้">
                          <Input type="number" min="1" step="1" value={form.usageDays} onChange={(event) => setForm((prev) => ({ ...prev, usageDays: event.target.value }))} placeholder="30" />
                        </Field>
                        <Field label="หมายเหตุ">
                          <Input value={form.note} onChange={(event) => setForm((prev) => ({ ...prev, note: event.target.value }))} placeholder="รายละเอียดเพิ่มเติม" />
                        </Field>
                      </FormGrid>
                    </div>
                  )}

                  {form.type === "expense" && (
                    <div className="space-y-4">
                      <FormGrid>
                        <Field label="วันที่">
                          <Input type="date" value={form.date} onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))} required />
                        </Field>
                        <Field label="ชื่อรายการ *">
                          <Input value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} placeholder="เช่น อาหารกลางวัน, ค่าเดินทาง" required />
                        </Field>
                        <Field label="จำนวนเงิน (บาท) *">
                          <Input type="number" min="0" step="0.01" value={form.amount} onChange={(event) => setForm((prev) => ({ ...prev, amount: event.target.value }))} placeholder="0.00" required />
                        </Field>
                        <Field label="บัญชีจ่ายเงิน *">
                          <select value={form.accountId} onChange={(event) => setForm((prev) => ({ ...prev, accountId: event.target.value }))} className={selectClassName} required>
                            <option value="">เลือกบัญชี</option>
                            {activeAccounts.map((account) => (
                              <option key={account.id} value={account.id}>
                                {account.accountName}
                              </option>
                            ))}
                          </select>
                        </Field>
                        <Field label="หมวดหมู่รายจ่าย">
                          <select value={form.categoryId} onChange={(event) => setForm((prev) => ({ ...prev, categoryId: event.target.value }))} className={selectClassName}>
                            <option value="">เลือกหมวดหมู่รายจ่าย</option>
                            {activeExpenseCategories.map((category) => (
                              <option key={category.id} value={category.id}>
                                {category.name}
                              </option>
                            ))}
                          </select>
                        </Field>
                        <Field label="หมายเหตุ">
                          <Input value={form.note} onChange={(event) => setForm((prev) => ({ ...prev, note: event.target.value }))} placeholder="รายละเอียดเพิ่มเติม" />
                        </Field>
                      </FormGrid>
                    </div>
                  )}

                  {form.type === "transfer" && (
                    <div className="space-y-4">
                      <FormGrid>
                        <Field label="วันที่ *">
                          <Input type="date" value={form.date} onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))} required />
                        </Field>
                        <Field label="จำนวนเงิน (บาท) *">
                          <Input type="number" min="0" step="0.01" value={form.amount} onChange={(event) => setForm((prev) => ({ ...prev, amount: event.target.value }))} placeholder="0.00" required />
                        </Field>
                        <Field label="จากบัญชีต้นทาง *">
                          <select value={form.fromAccountId} onChange={(event) => setForm((prev) => ({ ...prev, fromAccountId: event.target.value }))} className={selectClassName} required>
                            <option value="">เลือกบัญชีต้นทาง</option>
                            {activeAccounts.map((account) => (
                              <option key={`from-${account.id}`} value={account.id}>
                                {account.accountName}
                              </option>
                            ))}
                          </select>
                        </Field>
                        <Field label="ไปยังบัญชีปลายทาง *">
                          <select value={form.toAccountId} onChange={(event) => setForm((prev) => ({ ...prev, toAccountId: event.target.value }))} className={selectClassName} required>
                            <option value="">เลือกบัญชีปลายทาง</option>
                            {activeAccounts.map((account) => (
                              <option key={`to-${account.id}`} value={account.id}>
                                {account.accountName}
                              </option>
                            ))}
                          </select>
                        </Field>
                        <Field label="หมายเหตุ">
                          <Input value={form.note} onChange={(event) => setForm((prev) => ({ ...prev, note: event.target.value }))} placeholder="รายละเอียดการโอน" />
                        </Field>
                      </FormGrid>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2">
                    <Button type="button" variant="outline" onClick={closeModal}>
                      ยกเลิก
                    </Button>
                    <Button type="submit" disabled={saving}>
                      <Plus className="mr-2 h-4 w-4" />
                      {saving ? "กำลังบันทึก..." : mode === "edit" ? "บันทึกการแก้ไข" : "บันทึกรายการ"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <Card>
        <CardHeader className="space-y-2 border-b border-gray-100 pb-5">
          <CardTitle className="text-base">รายการธุรกรรม</CardTitle>
          <CardDescription>
            แสดง {filteredRows.length} รายการจากทั้งหมด {summary.itemCount} รายการ • รายรับ {summary.incomeCount} • รายจ่าย {summary.expenseCount} • โอนเงิน {summary.transferCount}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-5">
          <div className="lg:hidden grid gap-3">
            {filteredRows.length === 0 ? (
              <EmptyState />
            ) : (
              filteredRows.map((row) => (
                <TransactionMobileCard key={`${row.type}-${row.id}`} row={row} onEdit={() => openEditModal(row)} onDelete={() => void handleDelete(row)} />
              ))
            )}
          </div>

          <div className="hidden lg:block">
            {filteredRows.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
                <table className="w-full table-fixed text-left text-sm">
                  <thead className="bg-gray-50/90 text-xs uppercase text-gray-500">
                    <tr>
                      <Th>วันที่</Th>
                      <Th>ประเภท</Th>
                      <Th>รายการ</Th>
                      <Th>หมวดหมู่</Th>
                      <Th>บัญชี</Th>
                      <Th className="text-right">จำนวนเงิน</Th>
                      <Th>หมายเหตุ</Th>
                      <Th className="text-center">จัดการ</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {filteredRows.map((row) => (
                      <tr key={`${row.type}-${row.id}`} className="align-top hover:bg-gray-50/60">
                        <Td>{formatDateThai(row.date)}</Td>
                        <Td>
                          <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-medium", transactionBadgeClass[row.type])}>
                            {tabLabels[row.type]}
                          </span>
                        </Td>
                        <Td>
                          <div className="space-y-1">
                            <div className="font-medium text-gray-900">{row.title}</div>
                            {row.type === "transfer" && row.transferFromAccountLabel && row.transferToAccountLabel ? (
                              <div className="text-xs text-gray-500">
                                {row.transferFromAccountLabel} → {row.transferToAccountLabel}
                              </div>
                            ) : null}
                          </div>
                        </Td>
                        <Td className="text-gray-700">{row.categoryLabel || "-"}</Td>
                        <Td className="text-gray-700">{row.accountLabel}</Td>
                        <Td className="text-right font-medium">{renderAmount(row)}</Td>
                        <Td className="text-gray-700">
                          <span className="line-clamp-2">{row.note || "-"}</span>
                        </Td>
                        <Td>
                          <div className="flex items-center justify-center gap-1">
                            {row.canEdit ? (
                              <IconButton label="แก้ไข" onClick={() => openEditModal(row)}>
                                <PencilLine className="h-4 w-4" />
                              </IconButton>
                            ) : null}
                            <IconButton label="ลบ" onClick={() => void handleDelete(row)}>
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
        </CardContent>
      </Card>
    </div>
  );
}

function normalizeTab(value: string | null): TransactionTab {
  if (value === "income" || value === "expense" || value === "transfer") return value;
  return "all";
}

function getIncomeCategoryLabel(income: Income, categoryMap: Map<string, string>) {
  if (income.categoryId) {
    return categoryMap.get(income.categoryId) || income.source || "-";
  }
  return income.source || "-";
}

function getExpenseCategoryLabel(expense: Expense, categoryMap: Map<string, string>) {
  if (expense.categoryId) {
    return categoryMap.get(expense.categoryId) || expense.category || "-";
  }
  return expense.category || "-";
}

function renderAmount(row: UnifiedTransactionRow) {
  if (row.type === "income") {
    return <span className="font-medium text-green-700">+ {formatCurrency(row.amount)}</span>;
  }

  if (row.type === "expense") {
    return <span className="font-medium text-red-600">- {formatCurrency(row.amount)}</span>;
  }

  return <span className="font-medium text-gray-900">{formatCurrency(row.amount)}</span>;
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
    <Card className="border-gray-200 shadow-sm">
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

function FormGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 md:grid-cols-2">{children}</div>;
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

function EmptyState() {
  return <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-500">ยังไม่พบรายการที่ตรงกับตัวกรอง</div>;
}

function TransactionMobileCard({
  row,
  onEdit,
  onDelete,
}: {
  row: UnifiedTransactionRow;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className="border-gray-200 shadow-sm">
      <CardContent className="space-y-4 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="text-xs text-gray-500">{formatDateThai(row.date)}</div>
            <div className="text-base font-semibold text-gray-900">{row.title}</div>
            <div className="text-xs text-gray-500">
              {row.type === "transfer" && row.transferFromAccountLabel && row.transferToAccountLabel
                ? `${row.transferFromAccountLabel} → ${row.transferToAccountLabel}`
                : row.accountLabel}
            </div>
          </div>
          <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-medium", transactionBadgeClass[row.type])}>
            {tabLabels[row.type]}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-xl bg-gray-50 p-3">
            <p className="text-xs text-gray-500">หมวดหมู่</p>
            <p className="mt-1 font-semibold text-gray-900">{row.categoryLabel || "-"}</p>
          </div>
          <div className="rounded-xl bg-gray-50 p-3">
            <p className="text-xs text-gray-500">จำนวนเงิน</p>
            <p className="mt-1 text-base font-semibold">{renderAmount(row)}</p>
          </div>
        </div>

        <div className="rounded-xl bg-gray-50 p-3 text-sm text-gray-600">
          <span className="text-xs text-gray-500">หมายเหตุ</span>
          <p className="mt-1 line-clamp-2">{row.note || "-"}</p>
        </div>

        <div className="flex items-center justify-end gap-1">
          {row.canEdit ? (
            <IconButton label="แก้ไข" onClick={onEdit}>
              <PencilLine className="h-4 w-4" />
            </IconButton>
          ) : null}
          <IconButton label="ลบ" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </IconButton>
        </div>
      </CardContent>
    </Card>
  );
}

const transactionBadgeClass: Record<TransactionKind, string> = {
  income: "bg-green-100 text-green-800",
  expense: "bg-red-100 text-red-700",
  transfer: "bg-blue-100 text-blue-700",
};

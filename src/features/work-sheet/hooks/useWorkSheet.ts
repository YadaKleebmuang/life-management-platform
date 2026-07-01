"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/features/auth/contexts/AuthContext";
import type { PaymentType, WorkItem, WorkItemDraft, WorkItemPayment, WorkItemStatus } from "../types";
import {
  addPaymentToWorkItem,
  deleteWorkItem,
  getWorkItemPayments,
  getWorkItems,
  saveWorkItem,
  updateWorkItemStatus,
} from "../services/workSheetService";
import { notifyWorkSheetChanged, subscribeWorkSheetChanged } from "../utils/workSheetEvents";

export function useWorkSheet() {
  const { user, userProfile } = useAuth();
  const [items, setItems] = useState<WorkItem[]>([]);
  const [payments, setPayments] = useState<Record<string, WorkItemPayment[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const loadedItems = await getWorkItems();
      setItems(loadedItems);

      const paymentEntries = await Promise.all(
        loadedItems.map(async (item) => [item.id, await getWorkItemPayments(item.id)] as const)
      );

      setPayments(Object.fromEntries(paymentEntries));
    } catch (loadError) {
      console.error("Error loading work sheet items:", loadError);
      setError("โหลดข้อมูล work sheet ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadItems();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadItems]);

  useEffect(() => subscribeWorkSheetChanged(loadItems), [loadItems]);

  const addItem = async (item: WorkItemDraft) => {
    if (!user?.uid) return;
    const creatorName = userProfile?.displayName || user.email || "ผู้ใช้งาน";

    try {
      await saveWorkItem(crypto.randomUUID(), item, { uid: user.uid, name: creatorName });
      await loadItems();
      notifyWorkSheetChanged();
    } catch (saveError) {
      console.error("Error saving work item:", saveError);
      setError("บันทึกงานไม่สำเร็จ");
      throw saveError;
    }
  };

  const editItem = async (itemId: string, item: WorkItemDraft) => {
    if (!user?.uid) return;
    const creatorName = userProfile?.displayName || user.email || "ผู้ใช้งาน";

    try {
      await saveWorkItem(itemId, item, { uid: user.uid, name: creatorName });
      await loadItems();
      notifyWorkSheetChanged();
    } catch (saveError) {
      console.error("Error updating work item:", saveError);
      setError("แก้ไขงานไม่สำเร็จ");
      throw saveError;
    }
  };

  const removeItem = async (itemId: string) => {
    if (!user?.uid) return;

    try {
      await deleteWorkItem(itemId);
      await loadItems();
      notifyWorkSheetChanged();
    } catch (deleteError) {
      console.error("Error deleting work item:", deleteError);
      setError("ลบงานไม่สำเร็จ");
      throw deleteError;
    }
  };

  const addPayment = async (
    workItemId: string,
    clientId: string,
    clientName: string,
    paymentType: PaymentType,
    amount: number,
    paymentDate: string,
    note?: string,
    proofUrl?: string
  ) => {
    if (!user?.uid) return;
    const userName = userProfile?.displayName || user.email || "ผู้ใช้งาน";

    try {
      await addPaymentToWorkItem(
        user.uid,
        userName,
        workItemId,
        clientId,
        clientName,
        paymentType,
        amount,
        paymentDate,
        note,
        proofUrl
      );
      await loadItems();
      notifyWorkSheetChanged();
    } catch (paymentError) {
      console.error("Error saving payment:", paymentError);
      setError("บันทึกการจ่ายไม่สำเร็จ");
      throw paymentError;
    }
  };

  const changeStatus = async (workItemId: string, status: WorkItemStatus) => {
    if (!user?.uid) return;

    try {
      await updateWorkItemStatus(workItemId, status);
      await loadItems();
      notifyWorkSheetChanged();
    } catch (statusError) {
      console.error("Error updating work status:", statusError);
      setError("อัปเดตสถานะไม่สำเร็จ");
      throw statusError;
    }
  };

  return {
    items,
    payments,
    loading,
    error,
    addItem,
    editItem,
    removeItem,
    addPayment,
    changeStatus,
    refreshWorkSheet: loadItems,
  };
}

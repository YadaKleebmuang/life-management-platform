"use client";

import { useState, useEffect, useCallback } from "react";
import { Category, CategoryType } from "../types";
import { getCategories, saveCategory, deleteCategory, initializeDefaultCategories } from "../services/categoryService";
import { useAuth } from "@/features/auth/contexts/AuthContext";

export function useCategories() {
  const { user } = useAuth();
  const userId = user?.uid ?? "";
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCategories = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      let loaded = await getCategories(userId);
      if (loaded.length === 0) {
        // First time user, initialize default categories
        loaded = await initializeDefaultCategories(userId);
      }
      setCategories(loaded);
    } catch (error) {
      console.error("Error loading categories:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadCategories();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadCategories]);

  const addCategory = async (name: string, type: CategoryType, description?: string) => {
    if (!userId) return;
    const now = new Date().toISOString();
    const newCategory: Category = {
      id: crypto.randomUUID(),
      userId,
      name,
      type,
      description,
      isDefault: false,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    await saveCategory(userId, newCategory);
    await loadCategories();
  };

  const updateCategory = async (category: Category) => {
    if (!userId) return;
    const updated = { ...category, updatedAt: new Date().toISOString() };
    await saveCategory(userId, updated);
    await loadCategories();
  };

  const toggleCategoryActive = async (category: Category) => {
    if (!userId) return;
    const updated = { ...category, isActive: !category.isActive, updatedAt: new Date().toISOString() };
    await saveCategory(userId, updated);
    await loadCategories();
  };

  const removeCategory = async (categoryId: string) => {
    if (!userId) return;
    await deleteCategory(userId, categoryId);
    await loadCategories();
  };

  const activeIncomeCategories = categories.filter(c => c.type === "income" && c.isActive);
  const activeExpenseCategories = categories.filter(c => c.type === "expense" && c.isActive);

  return {
    categories,
    activeIncomeCategories,
    activeExpenseCategories,
    loading,
    addCategory,
    updateCategory,
    toggleCategoryActive,
    removeCategory,
    refreshCategories: loadCategories
  };
}

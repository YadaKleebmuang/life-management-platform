"use client";

import { useState, useEffect, useCallback } from "react";
import { Category, CategoryType } from "../types";
import { getCategories, saveCategory, deleteCategory, initializeDefaultCategories } from "../services/categoryService";
import { useAuth } from "@/features/auth/contexts/AuthContext";

export function useCategories() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCategories = useCallback(async () => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      let loaded = await getCategories(user.uid);
      if (loaded.length === 0) {
        // First time user, initialize default categories
        loaded = await initializeDefaultCategories(user.uid);
      }
      setCategories(loaded);
    } catch (error) {
      console.error("Error loading categories:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const addCategory = async (name: string, type: CategoryType, description?: string) => {
    if (!user?.uid) return;
    const now = new Date().toISOString();
    const newCategory: Category = {
      id: crypto.randomUUID(),
      userId: user.uid,
      name,
      type,
      description,
      isDefault: false,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    await saveCategory(user.uid, newCategory);
    await loadCategories();
  };

  const updateCategory = async (category: Category) => {
    if (!user?.uid) return;
    const updated = { ...category, updatedAt: new Date().toISOString() };
    await saveCategory(user.uid, updated);
    await loadCategories();
  };

  const toggleCategoryActive = async (category: Category) => {
    if (!user?.uid) return;
    const updated = { ...category, isActive: !category.isActive, updatedAt: new Date().toISOString() };
    await saveCategory(user.uid, updated);
    await loadCategories();
  };

  const removeCategory = async (categoryId: string) => {
    if (!user?.uid) return;
    await deleteCategory(user.uid, categoryId);
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

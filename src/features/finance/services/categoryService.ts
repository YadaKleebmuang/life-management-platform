import { db } from "@/lib/firebase";
import { collection, doc, getDocs, setDoc, deleteDoc, query, orderBy, writeBatch } from "firebase/firestore";
import { Category } from "../types";
import { stripUndefinedFields } from "../utils/stripUndefinedFields";

const defaultIncomeCategories = ["Salary", "Family", "Freelance", "Gift", "Other"];
const defaultExpenseCategories = ["Food", "Travel", "Education", "Shopping", "Health", "Entertainment", "Bills", "Other"];

export const getCategories = async (userId: string): Promise<Category[]> => {
  if (!userId) return [];
  const q = query(
    collection(db, "users", userId, "categories"),
    orderBy("createdAt", "asc")
  );
  const querySnapshot = await getDocs(q);
  const categories: Category[] = [];
  querySnapshot.forEach((doc) => {
    categories.push(doc.data() as Category);
  });
  return categories;
};

export const saveCategory = async (userId: string, category: Category): Promise<void> => {
  if (!userId) return;
  const docRef = doc(db, "users", userId, "categories", category.id);
  await setDoc(docRef, stripUndefinedFields(category));
};

export const deleteCategory = async (userId: string, categoryId: string): Promise<void> => {
  if (!userId) return;
  const docRef = doc(db, "users", userId, "categories", categoryId);
  await deleteDoc(docRef);
};

export const initializeDefaultCategories = async (userId: string): Promise<Category[]> => {
  if (!userId) return [];
  
  const categories: Category[] = [];
  const batch = writeBatch(db);
  const now = new Date().toISOString();

  defaultIncomeCategories.forEach(name => {
    const id = `default-income-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    const cat: Category = {
      id,
      userId,
      name,
      type: "income",
      isDefault: true,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    categories.push(cat);
    const docRef = doc(db, "users", userId, "categories", id);
    batch.set(docRef, stripUndefinedFields(cat));
  });

  defaultExpenseCategories.forEach(name => {
    const id = `default-expense-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    const cat: Category = {
      id,
      userId,
      name,
      type: "expense",
      isDefault: true,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    categories.push(cat);
    const docRef = doc(db, "users", userId, "categories", id);
    batch.set(docRef, stripUndefinedFields(cat));
  });

  await batch.commit();
  return categories;
};

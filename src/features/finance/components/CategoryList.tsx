"use client";

import { useState } from "react";
import { useCategories } from "../hooks/useCategories";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Category, CategoryType } from "../types";
import { Edit2, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";

export function CategoryList() {
  const { categories, addCategory, updateCategory, toggleCategoryActive, removeCategory, loading } = useCategories();
  const [name, setName] = useState("");
  const [type, setType] = useState<CategoryType>("expense");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    setSaving(true);
    try {
      if (editingId) {
        const existing = categories.find(c => c.id === editingId);
        if (existing) {
          await updateCategory({ ...existing, name, type, description });
        }
        setEditingId(null);
      } else {
        await addCategory(name, type, description);
      }

      resetForm();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("Error saving category:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    setName(category.name);
    setType(category.type);
    setDescription(category.description || "");
  };

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setType("expense");
    setDescription("");
  };

  const incomeCategories = categories.filter(c => c.type === "income");
  const expenseCategories = categories.filter(c => c.type === "expense");

  const renderTable = (cats: Category[], title: string) => (
    <div className="mt-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-4 py-3 font-medium">ชื่อหมวดหมู่</th>
              <th className="px-4 py-3 font-medium">รายละเอียด</th>
              <th className="px-4 py-3 font-medium text-center">สถานะ</th>
              <th className="px-4 py-3 font-medium text-center">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {cats.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                  ไม่มีข้อมูลหมวดหมู่
                </td>
              </tr>
            ) : (
              cats.map((cat) => (
                <tr key={cat.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 text-gray-900 font-medium">
                    {cat.name}
                    {cat.isDefault && <span className="ml-2 text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">ค่าเริ่มต้น</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{cat.description || "-"}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${cat.isActive ? 'bg-gray-100 text-gray-800' : 'bg-red-50 text-red-600'}`}>
                      {cat.isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(cat)}>
                        <Edit2 className="h-4 w-4 text-gray-400 hover:text-gray-900 transition-colors" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => toggleCategoryActive(cat)} title={cat.isActive ? "ปิดการใช้งาน" : "เปิดการใช้งาน"}>
                        {cat.isActive ? (
                          <ToggleRight className="h-5 w-5 text-gray-900" />
                        ) : (
                          <ToggleLeft className="h-5 w-5 text-gray-400" />
                        )}
                      </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => {
                            if (window.confirm("คุณต้องการลบหมวดหมู่นี้ใช่หรือไม่? (จะไม่ส่งผลกับรายการเก่าที่เคยบันทึกไว้)")) {
                              removeCategory(cat.id);
                            }
                          }}
                          title="ลบหมวดหมู่"
                        >
                          <Trash2 className="h-4 w-4 text-red-400 hover:text-red-600 transition-colors" />
                        </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "แก้ไขหมวดหมู่" : "เพิ่มหมวดหมู่ใหม่"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">ประเภท</label>
              <select
                className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={type}
                onChange={(e) => setType(e.target.value as CategoryType)}
                required
              >
                <option value="expense">รายจ่าย</option>
                <option value="income">รายรับ</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">ชื่อหมวดหมู่</label>
              <Input
                type="text"
                placeholder="เช่น ค่าอาหาร, เงินเดือน"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-gray-700">รายละเอียดเพิ่มเติม (ไม่บังคับ)</label>
              <Input
                type="text"
                placeholder="ระบุรายละเอียด..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {success && <div className="md:col-span-2 text-gray-900 bg-gray-100 p-3 rounded-lg border border-gray-200 text-sm font-medium flex items-center">
              <svg className="w-4 h-4 mr-2 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              ข้อมูลบันทึกแล้ว
            </div>}

            <div className="md:col-span-2 flex justify-end gap-2 mt-4">
              {editingId && (
                <Button type="button" variant="outline" onClick={resetForm} disabled={saving}>
                  ยกเลิก
                </Button>
              )}
              <Button type="submit" disabled={saving}>
                {saving ? "กำลังบันทึก..." : (editingId ? "บันทึกการแก้ไข" : "เพิ่มหมวดหมู่")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>รายการหมวดหมู่ทั้งหมด</CardTitle>
        </CardHeader>
        <CardContent>
          {renderTable(expenseCategories, "หมวดหมู่รายจ่าย")}
          {renderTable(incomeCategories, "หมวดหมู่รายรับ")}
        </CardContent>
      </Card>
    </div>
  );
}

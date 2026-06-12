import { CategoryList } from "@/features/finance/components/CategoryList";

export default function CategoriesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">จัดการหมวดหมู่</h1>
      <p className="text-gray-500 text-sm">เพิ่ม ลบ และปรับแต่งหมวดหมู่รายรับ/รายจ่ายของคุณ</p>
      <CategoryList />
    </div>
  );
}

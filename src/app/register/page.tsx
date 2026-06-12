"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Activity } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { registerWithEmail } from "@/features/auth/services/authService";
import { getAuthErrorMessage } from "@/features/auth/utils/errorMessages";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("รหัสผ่านไม่ตรงกัน");
      return;
    }

    if (password.length < 6) {
      setError("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }

    setLoading(true);

    try {
      await registerWithEmail(email, password, name);
      router.push("/login");
    } catch (err: any) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] p-4 py-12">
      <Card className="w-full max-w-md border-gray-200">
        <CardHeader className="text-center pb-6 pt-8">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 bg-gray-900 rounded-xl flex items-center justify-center shadow-sm">
              <Activity className="h-6 w-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 tracking-tight">
            สร้างบัญชีใหม่
          </CardTitle>
          <CardDescription className="text-gray-500 mt-2">
            เข้าร่วมแพลตฟอร์มเพื่อจัดการการเงินของคุณ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2 text-left">
              <label className="text-sm font-medium text-gray-900">ชื่อ-นามสกุล</label>
              <Input
                type="text"
                placeholder="สมชาย ใจดี"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="bg-white"
              />
            </div>
            <div className="space-y-2 text-left">
              <label className="text-sm font-medium text-gray-900">อีเมล</label>
              <Input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white"
              />
            </div>
            <div className="space-y-2 text-left">
              <label className="text-sm font-medium text-gray-900">รหัสผ่าน</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-white"
              />
            </div>
            <div className="space-y-2 text-left">
              <label className="text-sm font-medium text-gray-900">ยืนยันรหัสผ่าน</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="bg-white"
              />
            </div>

            {error && <div className="text-sm text-gray-900 bg-gray-100 p-3 rounded-lg border border-gray-200 font-medium">{error}</div>}

            <Button type="submit" className="w-full mt-2" disabled={loading}>
              {loading ? "กำลังสร้างบัญชี..." : "สมัครสมาชิก"}
            </Button>

            <div className="text-center text-sm text-gray-500 mt-6 pt-6 border-t border-gray-100">
              มีบัญชีอยู่แล้วใช่หรือไม่?{" "}
              <Link href="/login" className="text-gray-900 hover:text-gray-600 font-medium transition-colors">
                เข้าสู่ระบบ
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

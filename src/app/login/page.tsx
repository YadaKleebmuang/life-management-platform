"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loginWithEmail } from "@/features/auth/services/authService";
import { getAuthErrorMessage } from "@/features/auth/utils/errorMessages";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await loginWithEmail(email, password);
      router.push("/");
    } catch (err: any) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] p-4">
      <Card className="w-full max-w-md border-gray-200">
        <CardHeader className="text-center pb-6 pt-8">
          
          {/* โลโก้ของแอปพลิเคชัน */}
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 bg-white border border-gray-200 rounded-xl flex items-center justify-center shadow-sm overflow-hidden">
              <img src="/favicon.ico" alt="Logo" className="w-8 h-8 object-contain" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 tracking-tight">
            เข้าสู่ระบบ
          </CardTitle>
          <CardDescription className="text-gray-500 mt-2">
            ยินดีต้อนรับกลับเข้าสู่แพลตฟอร์มของคุณ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-5">
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
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-900">รหัสผ่าน</label>
              </div>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-white"
              />
            </div>

            {error && <div className="text-sm text-gray-900 bg-gray-100 p-3 rounded-lg border border-gray-200 font-medium">{error}</div>}

            <Button type="submit" className="w-full mt-2" disabled={loading}>
              {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </Button>

            <div className="text-center text-sm text-gray-500 mt-6 pt-6 border-t border-gray-100">
              ยังไม่มีบัญชีใช่หรือไม่?{" "}
              <Link href="/register" className="text-gray-900 hover:text-gray-600 font-medium transition-colors">
                สมัครสมาชิก
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

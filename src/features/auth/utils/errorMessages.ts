type AuthErrorLike = {
  code?: unknown;
  message?: unknown;
};

export function getAuthErrorMessage(error: unknown): string {
  const authError = error as AuthErrorLike | null;
  const errorCode = typeof authError?.code === "string" ? authError.code : "";

  switch (errorCode) {
    case "auth/email-already-in-use":
      return "อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้อีเมลอื่น";
    case "auth/invalid-email":
      return "รูปแบบอีเมลไม่ถูกต้อง";
    case "auth/weak-password":
      return "รหัสผ่านอ่อนเกินไป ต้องมีอย่างน้อย 6 ตัวอักษร";
    case "auth/user-not-found":
      return "ไม่พบบัญชีผู้ใช้นี้ในระบบ";
    case "auth/wrong-password":
      return "รหัสผ่านไม่ถูกต้อง";
    case "auth/invalid-credential":
      return "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
    case "auth/network-request-failed":
      return "การเชื่อมต่อล้มเหลว กรุณาตรวจสอบอินเทอร์เน็ตของคุณ";
    case "auth/too-many-requests":
      return "พยายามเข้าสู่ระบบบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่";
    case "auth/operation-not-allowed":
      return "การเข้าสู่ระบบด้วยอีเมลและรหัสผ่านยังไม่เปิดใช้งาน";
    default:
      if (typeof authError?.message === "string" && authError.message.trim()) {
        return authError.message;
      }
      return "เกิดข้อผิดพลาดในการดำเนินการ กรุณาลองใหม่อีกครั้ง";
  }
}

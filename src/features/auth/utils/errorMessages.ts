export function getAuthErrorMessage(error: any): string {
  const errorCode = error?.code || "";

  switch (errorCode) {
    case 'auth/email-already-in-use':
      return 'อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้อีเมลอื่น';
    case 'auth/invalid-email':
      return 'รูปแบบอีเมลไม่ถูกต้อง';
    case 'auth/weak-password':
      return 'รหัสผ่านอ่อนเกินไป (ต้องมีอย่างน้อย 6 ตัวอักษร)';
    case 'auth/user-not-found':
      return 'ไม่พบผู้ใช้งานนี้ในระบบ';
    case 'auth/wrong-password':
      return 'รหัสผ่านไม่ถูกต้อง';
    case 'auth/invalid-credential':
      return 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
    case 'auth/network-request-failed':
      return 'การเชื่อมต่อเครือข่ายล้มเหลว กรุณาตรวจสอบอินเทอร์เน็ตของคุณ';
    case 'auth/too-many-requests':
      return 'พยายามเข้าสู่ระบบบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่';
    default:
      if (error?.message) {
        return error.message; // Fallback to original message if not mapped
      }
      return 'เกิดข้อผิดพลาดในการดำเนินการ กรุณาลองใหม่อีกครั้ง';
  }
}

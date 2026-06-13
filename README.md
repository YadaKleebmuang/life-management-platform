# Life Management Platform 🎯💰

แพลตฟอร์มบริหารจัดการชีวิตและการเงินส่วนบุคคล (Personal Finance & Life Management) ที่จะช่วยให้คุณติดตามทุกความเคลื่อนไหวทางการเงินได้อย่างเป็นระบบ ทั้งรายรับ รายจ่าย การออมเงิน และการจัดการหนี้สิน ออกแบบมาให้ใช้งานง่าย ดีไซน์สวยงามทันสมัยแบบ Minimal Monochrome และมีระบบอัตโนมัติที่ช่วยให้การเงินของคุณเป็นระเบียบโดยไม่ต้องลงแรงเยอะ

## ✨ ฟีเจอร์หลัก (Key Features)

- 📊 **Dashboard & Analytics**: สรุปภาพรวมทางการเงินทั้งหมด ยอดเงินคงเหลือของทุกบัญชี และแสดงความคืบหน้าของเป้าหมายการออมในหน้าเดียว
- 👛 **Account Management**: จัดการบัญชีกระเป๋าเงินได้หลากหลายประเภท เช่น เงินสด, บัญชีธนาคาร, E-Wallet และบัญชีเงินฝาก
- 💸 **Income & Expense Tracking**: บันทึกรายรับ-รายจ่ายประจำวัน พร้อมจัดหมวดหมู่ที่ชัดเจน รวมถึงการโอนเงินระหว่างบัญชี (Transfer)
- 🔄 **Recurring Transactions & Auto-Split**: ตั้งค่ารายการที่เกิดซ้ำอัตโนมัติ (เช่น เงินเดือนเข้า, ค่าเช่าห้อง) **พิเศษ!** รองรับการแบ่งเงินรายรับเข้าบัญชีต่างๆ อัตโนมัติตามสัดส่วนที่ตั้งไว้ (เช่น กฎ 70/20/10)
- 🤝 **Debt Management**: ระบบบริหารจัดการหนี้สินแบบครบวงจร ทั้ง "หนี้สินที่เรายืมมา" และ "ลูกหนี้ที่ยืมเราไป" พร้อมระบบบันทึกประวัติการชำระเงินและคำนวณยอดคงเหลืออัตโนมัติ
- 🎯 **Savings Goals**: ตั้งเป้าหมายการออมเงิน (เช่น เก็บเงินเที่ยว, ซื้อคอมพิวเตอร์) และติดตามความคืบหน้าผ่าน Progress Bar
- ⚙️ **Financial Settings**: ตั้งค่าสัดส่วนการเงินอัตโนมัติ (Budget Allocation) และเพิ่ม/ลดหมวดหมู่รายรับ-รายจ่ายได้ตามไลฟ์สไตล์ของคุณ

## 🛠️ เทคโนโลยีที่ใช้ (Tech Stack)

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **Database & Auth**: [Firebase](https://firebase.google.com/) (Firestore & Firebase Authentication)
- **Language**: TypeScript

## 🚀 วิธีการติดตั้งและรันโปรเจกต์ (Getting Started)

1. **Clone project และติดตั้ง Dependencies**
   ```bash
   git clone <your-repo-url>
   cd life-management-platform
   npm install
   ```

2. **ตั้งค่า Firebase**
   - สร้างโปรเจกต์ใน [Firebase Console](https://console.firebase.google.com/)
   - เปิดใช้งาน Firebase Authentication (Email/Password) และ Firestore Database
   - นำค่า Configuration มาสร้างไฟล์ `.env.local` ที่ root ของโปรเจกต์:
     ```env
     NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
     NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
     NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
     NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
     NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
     NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
     ```

3. **รัน Development Server**
   ```bash
   npm run dev
   ```

4. เปิดเบราว์เซอร์ไปที่ [http://localhost:3000](http://localhost:3000)

## 📁 โครงสร้างโปรเจกต์ (Project Structure)

โปรเจกต์นี้ใช้สถาปัตยกรรมแบบ Feature-based ผสมผสานกับ Next.js App Router เพื่อความเป็นระเบียบและดูแลรักษาง่าย:

```text
src/
├── app/                  # Routes ต่างๆ ของ Next.js
├── components/           # UI Components ที่ใช้ร่วมกันทั้งแอป (เช่น ปุ่ม, การ์ด, Layout)
├── features/             # แบ่ง Module ตามฟีเจอร์หลักของแอป
│   ├── auth/             # ระบบยืนยันตัวตน (Login, Register, AuthContext)
│   └── finance/          # ระบบจัดการการเงิน (Income, Expense, Goals, Debts, Recurring, etc.)
└── lib/                  # Utilities และการตั้งค่าต่างๆ (เช่น Firebase config)
```

## 🤝 การมีส่วนร่วม (Contributing)

ยินดีต้อนรับทุกคำแนะนำและการ Pull Request! หากพบเจอบั๊กหรือมีข้อเสนอแนะฟีเจอร์ใหม่ๆ สามารถเปิด Issue แจ้งไว้ได้เลยครับ

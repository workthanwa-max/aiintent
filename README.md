# Clinic AI Booking System - Monnuruk 🏥✨

ระบบจองคิวอัจฉริยะสำหรับคลินิก พร้อมผู้ช่วย AI (Nong Nid) ที่เข้าใจภาษาธรรมชาติ และหน้าต่างการจัดการสำหรับเจ้าหน้าที่

## วิดีโอแนะนำการใช้งาน (Media)
![Clinic App Preview](presentation/assets/images/preview.png)

---

## 🛠️ ขั้นตอนการ Setup และเริ่มใช้งาน (Setup Guide)

สำหรับเพื่อนๆ ที่โหลด (Clone) โปรเจคนี้ไปใช้งาน ให้ทำตามลำดับดังนี้ครับ:

### 1. ติดตั้ง Dependencies (Install)
เปิด Terminal และรันคำสั่งดังนี้:
```bash
# ติดตั้ง Backend
cd application
npm install

# ติดตั้ง Frontend
cd ../presentation
npm install
```

### 2. ตั้งค่า API Key (Configuration)
คุณต้องมี API Key ของ **Typhoon AI** (OpenTyphoon) เพื่อรันระบบ AI:
- เข้าไปที่โฟลเดอร์ `application`
- สร้างไฟล์ชื่อ `.env` (เลียนแบบจาก `.env.example`)
- ใส่ Key ของคุณ: `TYPHOON_API_KEY=your_key_here`

### 3. เริ่มรันระบบ (Starting)

#### รัน Backend (Server):
```bash
cd application
npm run dev
```
*(Server จะรันที่พอร์ต 3000 และสร้างไฟล์ฐานข้อมูล `database.sqlite` ให้โดยอัตโนมัติ)*

#### รัน Frontend (App):
```bash
cd presentation
npx expo start --web
```
*(ระบบจะเปิดหน้าเว็บแอพพลิเคชันขึ้นมาให้ใช้งาน)*

---

## 👤 บัญชีทดลองใช้งาน (Seed Accounts)

ระบบมาพร้อมข้อมูลเบื้องต้นสำหรับทดสอบ:
- **ลูกค้า (Customer):** `user1` / รหัสผ่าน: `1234`
- **เจ้าหน้าที่ (Staff):** `staff1` / รหัสผ่าน: `1234`

---

## ✨ ความสามารถของระบบ (Features)
- 🤖 **AI Assistant:** จองคิว, เช็กคิว, และยกเลิกนัดหมายผ่านการแชทภาษาไทยปกติ
- 🎫 **Rich UI:** แสดงใบนัดหมายเป็นกราฟิกสวยงามในแชท
- 📊 **Staff Dashboard:** ระบบจัดการคิววันนี้ และจัดการหมวดหมู่บริการแบบ Dynamic
- 🌙 **Modern Design:** ธีม "Calm Wellness" สีกรมท่า-มินต์ ดูสะอาดตาและพรีเมียม

---
*Powered by SSKRU x Gemini AI*

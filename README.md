# GT7 MOTOR CMS

ระบบจัดการเนื้อหาสำหรับหน้า Landing Page ของ GT7 MOTOR พัฒนาด้วย Next.js และ Supabase ผู้ดูแลสามารถแก้ไข header, เนื้อหากลางหน้า และ footer ผ่านหน้าแอดมิน โดยไม่ต้อง build ใหม่ทุกครั้งที่เผยแพร่เนื้อหา

## ความสามารถ

- แก้ไขโลโก้ เมนูนำทาง และปุ่มใน header
- เพิ่มและจัดเรียง section ของหน้าเว็บ โดยเลือก template เช่น hero, การ์ด, แกลเลอรี, CTA และข้อความ
- แก้ไข footer ได้สูงสุด 4 คอลัมน์ รองรับโลโก้ ลิงก์ ข้อมูลติดต่อ และ LINE
- อัปโหลดรูปไปยัง Supabase Storage bucket `site-assets`
- ป้องกันหน้า `/admin` ด้วย Supabase Auth และ `app_metadata.role = 'admin'`
- อ่านเนื้อหาสาธารณะด้วย anon key และแคชหน้าเว็บ โดยการบันทึกจากแอดมินจะสั่ง revalidate หน้าแรก

## เทคโนโลยี

- Next.js 16, React 19 และ TypeScript
- Supabase Auth, Postgres, Row Level Security (RLS) และ Storage
- Tailwind CSS 4

## สิ่งที่ต้องมี

- Node.js รุ่นที่รองรับ Next.js 16
- npm
- โปรเจกต์ Supabase
- Supabase CLI ใช้ผ่าน `npx supabase`

## ติดตั้งและเริ่มใช้งาน

เปิด terminal ในโฟลเดอร์ `my-app`:

```powershell
cd C:\Users\wirun\Downloads\gt7-cms\my-app
npm ci
```

สร้างไฟล์ `.env.local` ที่ root ของโปรเจกต์ แล้วกำหนดค่าจาก Supabase Dashboard → **Project Settings → API**:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

ห้ามใส่ `service_role` key หรือรหัสผ่านในตัวแปร `NEXT_PUBLIC_*` และห้าม commit ไฟล์ environment ที่มีค่าจริง

## ตั้งค่าฐานข้อมูล Supabase

การเปลี่ยนแปลงฐานข้อมูลที่ใช้ deploy ให้เก็บเป็นไฟล์ใน `supabase/migrations/` โดยใช้ชื่อขึ้นต้นด้วย timestamp เช่น `20261109022300_initial_schema.sql`

### เชื่อมโปรเจกต์และรัน migration

```powershell
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase migration list --remote
npx supabase db push
```

ตรวจผลด้วย `npx supabase migration list --remote` ควรเห็น migration ที่รันแล้วตรงกับรายการ local

Migration เริ่มต้นสร้างตาราง CMS, enum, ฟังก์ชันบันทึกข้อมูล, RLS policies และ Storage bucket `site-assets` ให้ครบ หากฐานข้อมูลมีตารางจากการติดตั้งแบบเดิมอยู่แล้ว อย่ารัน migration เริ่มต้นหรือ `supabase/schema.sql` ซ้ำโดยไม่ตรวจ migration history และ schema ก่อน

`supabase/schema.sql` เป็นสำเนา schema เริ่มต้นสำหรับติดตั้งฐานข้อมูลใหม่แบบ SQL Editor ส่วนการเปลี่ยน schema หลังจากนี้ให้เพิ่ม migration แล้วใช้ `supabase db push` อย่าใช้ทั้งสองวิธีซ้ำกับฐานข้อมูลเดียวกัน

### สร้างบัญชีผู้ดูแล

1. ใน Supabase Dashboard เปิด **Authentication → Users → Add user** แล้วสร้างผู้ใช้ด้วยอีเมลและรหัสผ่านที่ผู้ดูแลตั้งเอง
2. เปิด **SQL Editor** แล้วกำหนด role ให้บัญชี โดยเปลี่ยนอีเมลในเงื่อนไขให้ตรงกับผู้ใช้:

```sql
update auth.users
set raw_app_meta_data =
  coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
where email = 'admin@example.com'
returning email, raw_app_meta_data->>'role' as role;
```

3. ตรวจผลให้ `role` เป็น `admin` แล้วออกจากระบบและเข้าสู่ระบบใหม่ เพื่อให้ session ได้รับข้อมูลสิทธิ์ล่าสุด

สิทธิ์เขียนถูกตรวจทั้งในแอปและในฐานข้อมูลผ่าน RLS ห้ามกำหนด `role` ผ่าน `user_metadata` ที่ผู้ใช้แก้เองได้

## คำสั่งพัฒนาและตรวจสอบ

```bash
npm run dev
npm run lint
npm run build
npm run start
```

เปิดเว็บพัฒนาที่ `http://localhost:3000` หน้าแอดมินอยู่ที่ `/admin` และหน้าเข้าสู่ระบบอยู่ที่ `/admin/login`

## โครงสร้างสำคัญ

เอกสารความต้องการผลิตภัณฑ์ (PRD): [docs/PRD.md](./docs/PRD.md)

```text
src/
  app/
    admin/
      (panel)/       หน้าแดชบอร์ดและตัวแก้ไข header/body/footer
      actions.ts     Server Actions สำหรับบันทึกข้อมูล
      login/         หน้าเข้าสู่ระบบ
    page.tsx         หน้า Landing Page
  components/
    admin/           ตัวแก้ไขและส่วนประกอบของ CMS
    site/            ส่วนแสดงผลหน้าเว็บ
  lib/
    content.ts       โหลดและประกอบข้อมูลจาก Supabase
    admin.ts         โหลดข้อมูลสำหรับหน้าแอดมิน
    defaults.ts      ข้อมูลตัวอย่างเริ่มต้นของตัวแก้ไข
    supabase/        client สำหรับ browser, server และ public
  middleware.ts      ตรวจ session และ role สำหรับ /admin
supabase/
  migrations/        migration ที่ใช้ deploy
  schema.sql         schema เริ่มต้นแบบ SQL Editor
```

การบันทึกจากตัวแก้ไขเรียก RPC `save_header`, `save_body` หรือ `save_footer`; ฟังก์ชันเหล่านี้ตรวจ `is_admin()` และเขียนข้อมูลใน transaction เดียว ตารางเนื้อหาสาธารณะเปิดให้อ่านผ่าน RLS ส่วนการเขียนจำกัดเฉพาะผู้ดูแล

## แก้ปัญหาเบื้องต้น

- **หา table หรือ RPC ไม่พบ:** ตรวจว่ารัน migration กับ Supabase project ที่ตรงกับ `NEXT_PUBLIC_SUPABASE_URL` แล้ว
- **เข้าสู่ระบบได้แต่เข้าแอดมินไม่ได้:** ตรวจ `auth.users.raw_app_meta_data` ว่ามี `"role": "admin"` และ login ใหม่
- **รูปอัปโหลดไม่ได้:** ตรวจว่ามี bucket `site-assets` และผู้ใช้มี role แอดมิน
- **ไม่มีเนื้อหาบนหน้าเว็บ:** ตรวจค่า environment, migration และข้อมูลเริ่มต้นจากหน้า `/admin`
- **รัน npm ไม่พบ `package.json`:** เปลี่ยน directory เข้า `my-app` ก่อนรันคำสั่ง npm

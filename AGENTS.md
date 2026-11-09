<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# แนวทางสำหรับ AI และผู้พัฒนา

## โครงสร้างและรูปแบบ

- โปรเจกต์ใช้ Next.js App Router, React, TypeScript แบบ strict และ alias `@/*` ที่ชี้ไปยัง `src/*`
- หน้า public อยู่ใน `src/app`; ส่วนหน้าแอดมินอยู่ใน `src/app/admin` และ UI แบ่งระหว่าง `src/components/admin` กับ `src/components/site`
- ใช้ Supabase helpers ที่มีใน `src/lib/supabase` และชนิดข้อมูลกลางใน `src/lib/types.ts` ก่อนเพิ่ม client หรือ type ซ้ำ
- ก่อนแก้ API, routing หรือ config ของ Next.js ให้อ่านเอกสารที่ติดตั้งไว้ใน `node_modules/next/dist/docs/` ตามกฎด้านบน

## Supabase และความปลอดภัย

- อ่านเฉพาะชื่อตัวแปรจาก `.env` เมื่อจำเป็น ห้ามแสดงหรือ commit ค่า secret; แอปใช้ `NEXT_PUBLIC_SUPABASE_URL` และ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ห้ามใช้ service-role key ใน browser หรือในตัวแปร `NEXT_PUBLIC_*`
- การเข้าถึงแอดมินต้องตรวจ `user.app_metadata.role === 'admin'`; รักษาการตรวจซ้ำใน Server Actions และ RLS
- เปลี่ยน schema ด้วยไฟล์ใหม่ใน `supabase/migrations/` และ `npx supabase db push`; อย่ารัน `supabase/schema.sql` ซ้ำบนฐานข้อมูลที่จัดการด้วย migration แล้ว
- คุกกี้ Supabase ฝั่ง server ต้องใช้ `getAll`/`setAll` และคงชนิดข้อมูลที่ปลอดภัย ห้ามแก้ด้วย implicit `any`

## ตรวจสอบและเอกสาร

- ทำการเปลี่ยนแปลงให้สอดคล้องทั้งส่วน editor, Server Actions, RPC และส่วนแสดงผลที่เกี่ยวข้อง
- รัน `npm run lint` หรือ `npm run build` ตามขอบเขตการเปลี่ยนแปลง
- อัปเดต [README.md](./README.md) เมื่อขั้นตอนติดตั้ง ตั้งค่า Supabase หรือการใช้งานเปลี่ยนไป

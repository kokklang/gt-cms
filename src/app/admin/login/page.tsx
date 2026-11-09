'use client'
import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setErr('')
    const sb = createClient()
    const { data, error } = await sb.auth.signInWithPassword({ email, password })
    if (error) {
      setErr('อีเมลหรือรหัสผ่านไม่ถูกต้อง')
      setBusy(false)
      return
    }
    if (data.user?.app_metadata?.role !== 'admin') {
      await sb.auth.signOut()
      setErr('บัญชีนี้ไม่มีสิทธิ์แอดมิน (ตั้ง app_metadata.role = admin ตามคู่มือ README ข้อ 3)')
      setBusy(false)
      return
    }
    router.replace('/admin')
    router.refresh()
  }

  return (
    <div className="adm adm-login">
      <form onSubmit={submit}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.4rem' }}>เข้าสู่ระบบแอดมิน</h1>
          <p className="adm-sub" style={{ margin: '4px 0 0' }}>GT7 MOTOR console</p>
        </div>
        <input type="email" required placeholder="อีเมล" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input type="password" required placeholder="รหัสผ่าน" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {err && <div className="adm-warn" role="alert">{err}</div>}
        <button className="btn primary" type="submit" disabled={busy} style={{ justifyContent: 'center' }}>
          {busy ? 'กำลังเข้าสู่ระบบ…' : 'เข้าสู่ระบบ'}
        </button>
      </form>
    </div>
  )
}

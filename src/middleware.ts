import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient, type SetAllCookies } from '@supabase/ssr'

/** ปกป้องทุกหน้า /admin: ต้อง login และมี app_metadata.role = 'admin' */
export async function middleware(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    return new NextResponse('ยังไม่ได้ตั้งค่า NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY', { status: 500 })
  }

  let res = NextResponse.next({ request: req })
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return req.cookies.getAll()
      },
      setAll(list: Parameters<SetAllCookies>[0]) {
        list.forEach(({ name, value }) => req.cookies.set(name, value))
        res = NextResponse.next({ request: req })
        list.forEach(({ name, value, options }) => res.cookies.set(name, value, options))
      },
    },
  })

  const { data: { user } } = await supabase.auth.getUser()
  const isAdmin = user?.app_metadata?.role === 'admin'
  const isLogin = req.nextUrl.pathname === '/admin/login'

  const redirectTo = (path: string) => {
    const r = NextResponse.redirect(new URL(path, req.url))
    res.cookies.getAll().forEach((c) => r.cookies.set(c))
    return r
  }
  if (!isAdmin && !isLogin) return redirectTo('/admin/login')
  if (isAdmin && isLogin) return redirectTo('/admin')
  return res
}

export const config = { matcher: ['/admin/:path*'] }

'use client'

import { useState } from 'react'
import { videoSource } from './link'

export function VideoPlayer({ url }: { url: string | null }) {
  const [failed, setFailed] = useState(false)
  const source = videoSource(url)
  if (!source) return <p className="s-video-error">URL วิดีโอไม่ถูกต้อง กรุณาใช้ลิงก์ YouTube, Vimeo หรือไฟล์ MP4/WebM แบบ HTTPS</p>
  if (failed) return <p className="s-video-error">เล่นวิดีโอไม่ได้ กรุณาตรวจสอบ URL หรือสิทธิ์การเข้าถึงไฟล์</p>

  return source.type === 'embed' ? (
    <iframe
      className="s-video"
      src={source.url}
      title="วิดีโอ"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      referrerPolicy="strict-origin-when-cross-origin"
      allowFullScreen
      onError={() => setFailed(true)}
    />
  ) : (
    <video
      className="s-video"
      controls
      preload="metadata"
      playsInline
      onError={() => setFailed(true)}
    >
      <source src={source.url} />
      เบราว์เซอร์นี้ไม่รองรับวิดีโอ
    </video>
  )
}

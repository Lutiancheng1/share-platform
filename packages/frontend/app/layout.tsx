import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '跨设备共享平台',
  description: '快速分享链接、文本、图片和文件'
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Lock } from 'lucide-react'
import { getApiUrl } from '@/lib/utils'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // 检查是否有邀请链接
  useEffect(() => {
    const inviteToken = searchParams.get('invite')

    if (inviteToken) {
      // 自动进行访客登录
      handleGuestLogin(inviteToken)
    } else {
      // 检查是否已登录
      const token = localStorage.getItem('auth_token')
      if (token) {
        router.push('/')
      }
    }
  }, [searchParams, router])

  const handleGuestLogin = async (inviteToken: string) => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${getApiUrl()}/api/auth/guest/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ inviteToken })
      })

      if (!response.ok) {
        throw new Error('邀请链接无效或已过期')
      }

      const data = await response.json()

      // 保存token和用户类型
      localStorage.setItem('auth_token', data.token)
      localStorage.setItem('user_type', data.type)

      // 跳转到主页
      router.push('/')
    } catch (err) {
      const error = err as Error
      setError(error.message || '登录失败')
      setLoading(false)
    }
  }

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${getApiUrl()}/api/auth/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password })
      })

      if (!response.ok) {
        throw new Error('管理员密码错误')
      }

      const data = await response.json()

      // 保存token和用户类型
      localStorage.setItem('auth_token', data.token)
      localStorage.setItem('user_type', data.type)

      // 跳转到主页
      router.push('/')
    } catch (err) {
      const error = err as Error
      setError(error.message || '登录失败')
      setPassword('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary p-4">
      <Card className="w-full max-w-md pt-4">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">跨设备共享平台</CardTitle>
          <CardDescription>管理员登录</CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type="password" placeholder="管理员密码" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10" disabled={loading} required autoFocus />
              </div>
            </div>

            {error && <p className="text-sm text-red-500 text-center">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '登录中...' : '登录'}
            </Button>

            <div className="text-center text-sm text-muted-foreground space-y-1">
              <p>需要邀请链接才能访问</p>
              <p className="text-xs">请联系管理员获取访问权限</p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

'use client'

import { copyToClipboard } from '@/lib/utils'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { RadioGroup, RadioGroupItem } from './ui/radio-group'
import { Copy, Link as LinkIcon, Check } from 'lucide-react'

export function InviteLinkGenerator() {
  const [inviteUrl, setInviteUrl] = useState('')
  const [expiresIn, setExpiresIn] = useState<string>('7')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleGenerate = async () => {
    setLoading(true)
    setCopied(false)

    try {
      const token = localStorage.getItem('auth_token')
      const apiUrl = `http://${window.location.hostname}:3001/api/admin/invite/generate`
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          expiresInDays: expiresIn === 'forever' ? null : parseInt(expiresIn)
        })
      })

      if (!response.ok) {
        throw new Error('生成失败')
      }

      const data = await response.json()
      setInviteUrl(data.url)
    } catch {
      alert('生成邀请链接失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    const success = await copyToClipboard(inviteUrl)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } else {
      alert('复制失败，请长按链接手动复制')
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-6 w-6 p-0" title="生成邀请链接">
          <LinkIcon className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>生成邀请链接</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>有效期</Label>
            <RadioGroup value={expiresIn} onValueChange={setExpiresIn}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="1" id="1day" />
                <Label htmlFor="1day" className="cursor-pointer">
                  24小时
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="7" id="7days" />
                <Label htmlFor="7days" className="cursor-pointer">
                  7天
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="30" id="30days" />
                <Label htmlFor="30days" className="cursor-pointer">
                  30天
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="forever" id="forever" />
                <Label htmlFor="forever" className="cursor-pointer">
                  永久有效
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Button onClick={handleGenerate} disabled={loading} className="w-full">
            {loading ? '生成中...' : '生成链接'}
          </Button>

          {inviteUrl && (
            <div className="space-y-2">
              <Label>邀请链接</Label>
              <div className="flex gap-2">
                <Input value={inviteUrl} readOnly className="font-mono text-xs cursor-text" onClick={(e) => e.currentTarget.select()} />
                <Button size="icon" variant="outline" onClick={handleCopy} title="复制链接">
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">分享此链接给他人即可访问平台</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

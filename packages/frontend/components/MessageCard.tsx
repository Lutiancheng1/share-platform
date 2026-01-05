import { useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Message } from '@/lib/types'
import { Copy, ExternalLink, FileText } from 'lucide-react'
import { getApiUrl, copyToClipboard } from '@/lib/utils'
import { PhotoView } from 'react-photo-view'

interface MessageCardProps {
  message: Message
  selectable?: boolean
  selected?: boolean
  onSelect?: () => void
}

export function MessageCard({ message, selectable, selected, onSelect }: MessageCardProps) {
  const handleCopy = async (text: string) => {
    const success = await copyToClipboard(text)
    if (success) {
      toast.success('复制成功')
    } else {
      toast.error('复制失败')
    }
  }

  const renderContent = () => {
    switch (message.type) {
      case 'text':
        return (
          <div className="space-y-1.5">
            <p className="text-xs leading-relaxed whitespace-pre-wrap break-all">
              {message.content?.split(/(https?:\/\/[^\s]+)/g).map((part, index) => {
                if (part.match(/^https?:\/\//)) {
                  return (
                    <a key={index} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all" onClick={(e) => e.stopPropagation()}>
                      {part}
                    </a>
                  )
                }
                return part
              })}
            </p>
            <Button
              size="sm"
              variant="outline"
              className="h-6 w-6 p-0"
              title="复制"
              onClick={(e) => {
                e.stopPropagation()
                handleCopy(message.content || '')
              }}
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        )

      case 'link':
        return (
          <div className="space-y-1.5">
            <a href={message.content} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1 break-all" onClick={(e) => e.stopPropagation()}>
              <ExternalLink className="h-3 w-3 shrink-0" />
              <span className="line-clamp-2">{message.content}</span>
            </a>
            <Button
              size="sm"
              variant="outline"
              className="h-6 w-6 p-0"
              title="复制"
              onClick={(e) => {
                e.stopPropagation()
                handleCopy(message.content || '')
              }}
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        )

      case 'image':
        return (
          <div className="space-y-1.5" onClick={(e) => e.stopPropagation()}>
            <PhotoView src={`${getApiUrl()}${message.url}`}>
              <img src={`${getApiUrl()}${message.url}`} alt={message.filename || '图片'} className="rounded max-h-32 object-cover cursor-pointer hover:opacity-90 transition-opacity" />
            </PhotoView>
          </div>
        )

      case 'file':
        return (
          <a href={`${getApiUrl()}${message.url}`} target="_blank" rel="noopener noreferrer" className="block" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 p-2 bg-secondary rounded cursor-pointer hover:bg-secondary/80 transition-colors">
              <FileText className="h-6 w-6 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{message.filename}</p>
                <p className="text-[10px] text-muted-foreground">{message.fileSize ? `${(message.fileSize / 1024).toFixed(1)} KB` : ''}</p>
              </div>
            </div>
          </a>
        )

      default:
        return null
    }
  }

  return (
    <Card className={`hover:shadow-sm transition-shadow relative ${selectable ? 'cursor-pointer' : ''} ${selected ? 'ring-2 ring-primary' : ''}`} onClick={() => selectable && onSelect?.()}>
      {selectable && (
        <div className="absolute top-2 right-2 z-10">
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selected ? 'bg-primary border-primary' : 'border-muted-foreground bg-background'}`}>{selected && <div className="w-2.5 h-2.5 bg-primary-foreground rounded-full" />}</div>
        </div>
      )}
      <CardContent className="p-2.5 space-y-1.5">
        <div className="flex items-center gap-1.5 mb-1">
          <Badge variant={message.type === 'text' ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0">
            {message.type}
          </Badge>
          <span className="text-[10px] text-muted-foreground">
            {new Date(message.createdAt).toLocaleString('zh-CN', {
              timeZone: 'Asia/Shanghai',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            })}
          </span>
        </div>
        {renderContent()}
      </CardContent>
    </Card>
  )
}

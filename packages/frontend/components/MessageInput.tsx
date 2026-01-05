'use client'

import { useState, useRef, useImperativeHandle, forwardRef, useEffect } from 'react'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Input } from './ui/input'
import { Send, Image as ImageIcon, Paperclip, X, Upload } from 'lucide-react'
import { getApiUrl } from '@/lib/utils'
import { PhotoView } from 'react-photo-view'
import { toast } from 'sonner'

export interface MessageInputRef {
  addFiles: (files: File[]) => void
}

interface MessageInputProps {
  onSend: (type: string, content?: string, url?: string, filename?: string, fileSize?: number) => void
}

export const MessageInput = forwardRef<MessageInputRef, MessageInputProps>(({ onSend }, ref) => {
  const [text, setText] = useState('')
  const [uploading, setUploading] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  useImperativeHandle(ref, () => ({
    addFiles: (files: File[]) => {
      handleFiles(files)
    }
  }))

  const handleFiles = (files: File[]) => {
    const newFiles = [...selectedFiles, ...files]
    setSelectedFiles(newFiles)

    // 生成预览URL
    const newPreviewUrls = [...previewUrls]
    files.forEach((file) => {
      if (file.type.startsWith('image/')) {
        newPreviewUrls.push(URL.createObjectURL(file))
      } else {
        newPreviewUrls.push('')
      }
    })
    setPreviewUrls(newPreviewUrls)
  }

  const handleSend = async () => {
    if ((!text.trim() && selectedFiles.length === 0) || uploading) return

    setUploading(true)
    try {
      // 发送文本
      if (text.trim()) {
        // 检查是否是链接
        const urlRegex = /^(http|https):\/\/[^ "]+$/
        const type = urlRegex.test(text.trim()) ? 'link' : 'text'
        onSend(type, text.trim())
        setText('')
      }

      // 发送文件
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i]
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch(`${getApiUrl()}/api/upload/file`, {
          method: 'POST',
          body: formData
        })

        if (!response.ok) throw new Error('上传失败')

        const data = await response.json()
        const type = file.type.startsWith('image/') ? 'image' : 'file'
        onSend(type, undefined, data.url, file.name, file.size)
      }

      // 清理文件和预览
      previewUrls.forEach((url) => {
        if (url) URL.revokeObjectURL(url)
      })
      setSelectedFiles([])
      setPreviewUrls([])
    } catch (err) {
      console.error('发送失败:', err)
      toast.error('发送失败，请重试')
    } finally {
      setUploading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files))
    }
    // 清空input，允许重复选择同一文件
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    if (e.clipboardData.files && e.clipboardData.files.length > 0) {
      e.preventDefault()
      handleFiles(Array.from(e.clipboardData.files))
    }
  }

  const handleRemoveFile = (index: number) => {
    const newFiles = [...selectedFiles]
    const newPreviewUrls = [...previewUrls]

    // 如果是图片，释放URL对象
    if (newPreviewUrls[index]) {
      URL.revokeObjectURL(newPreviewUrls[index])
    }

    newFiles.splice(index, 1)
    newPreviewUrls.splice(index, 1)

    setSelectedFiles(newFiles)
    setPreviewUrls(newPreviewUrls)
  }

  return (
    <div className="p-4 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* 文件预览区域 */}
      {selectedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 pb-2">
          {selectedFiles.map((file, index) => {
            const isImage = file.type.startsWith('image/')
            return (
              <div key={index} className="relative group">
                {isImage && previewUrls[index] ? (
                  // 图片预览
                  <div className="relative">
                    <PhotoView src={previewUrls[index]}>
                      <img src={previewUrls[index]} alt={file.name} className="h-20 w-20 rounded border object-cover cursor-pointer" title={file.name} />
                    </PhotoView>
                    {/* 右上角删除按钮 */}
                    <button onClick={() => handleRemoveFile(index)} className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow-md" title="删除">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  // 文件预览
                  <div className="flex items-center gap-2 p-2 bg-secondary rounded text-xs w-48">
                    <span className="flex-1 truncate" title={file.name}>
                      {file.name}
                    </span>
                    <button onClick={() => handleRemoveFile(index)} className="h-5 w-5 rounded-full hover:bg-background flex items-center justify-center">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div className="flex gap-2 relative">
        <Textarea placeholder="输入消息或直接粘贴图片/文件... (Ctrl/Cmd + Enter 发送)" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={handleKeyPress} onPaste={handlePaste} className="min-h-[50px] max-h-[100px] resize-none text-sm" disabled={uploading} />
      </div>

      <div className="flex gap-2 justify-between mt-2">
        <div className="flex gap-1.5">
          <Input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} accept="image/*,.pdf,.txt,.json" multiple />
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            <ImageIcon className="h-3 w-3 mr-1" />
            图片
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            <Paperclip className="h-3 w-3 mr-1" />
            文件
          </Button>
        </div>

        <Button size="sm" className="h-7 text-xs" onClick={handleSend} disabled={(!text.trim() && selectedFiles.length === 0) || uploading}>
          <Send className="h-3 w-3 mr-1" />
          {uploading ? '上传中...' : selectedFiles.length > 0 ? `发送 (${selectedFiles.length})` : '发送'}
        </Button>
      </div>
    </div>
  )
})

MessageInput.displayName = 'MessageInput'

'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { MessageCard } from '@/components/MessageCard'
import { MessageInput, MessageInputRef } from '@/components/MessageInput'
import { SearchBar } from '@/components/SearchBar'
import { SettingsDialog } from '@/components/SettingsDialog'
import { OnlineUsersModal } from '@/components/OnlineUsersModal'
import { InviteLinkGenerator } from '@/components/InviteLinkGenerator'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { socketService } from '@/lib/socket'
import { Message, MessageDto } from '@/lib/types'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Users, ArrowUp, ArrowDown, Upload, MoreVertical, Trash2, X, Search } from 'lucide-react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { cn, getApiUrl } from '@/lib/utils'
import { PhotoProvider } from 'react-photo-view'
import 'react-photo-view/dist/react-photo-view.css'
import { toast } from 'sonner'

type AppUserType = 'admin' | 'guest'

interface JwtTokenPayload {
  type?: AppUserType
  exp?: number
}

function parseJwtPayload(token: string): JwtTokenPayload | null {
  try {
    const [, payloadPart] = token.split('.')
    if (!payloadPart) return null
    const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/')
    const normalized = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
    const payloadString = atob(normalized)
    return JSON.parse(payloadString) as JwtTokenPayload
  } catch {
    return null
  }
}

function isTokenExpired(payload: JwtTokenPayload): boolean {
  if (!payload.exp) return false
  return payload.exp * 1000 <= Date.now()
}

function HomeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [messages, setMessages] = useState<Message[]>([])
  const [onlineCount, setOnlineCount] = useState(0)
  const [connected, setConnected] = useState(false)
  const [showScrollButtons, setShowScrollButtons] = useState<'both' | 'up' | 'down' | false>(false)
  const [loading, setLoading] = useState(true)
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const [searchVisible, setSearchVisible] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<number[]>([])
  const [currentResultIndex, setCurrentResultIndex] = useState(0)
  const [userType, setUserType] = useState<'admin' | 'guest' | null>(null)
  const [showOnlineUsers, setShowOnlineUsers] = useState(false)
  const [isSelectMode, setIsSelectMode] = useState(false)
  const [selectedMessageIds, setSelectedMessageIds] = useState<Set<string>>(new Set())
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)
  const messageInputRef = useRef<MessageInputRef>(null)
  const dragCounter = useRef(0)

  // 从localStorage读取列数配置，默认为1
  const [columns, setColumns] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('message-columns')
      return saved ? parseInt(saved, 10) : 1
    }
    return 1
  })

  // 保存列数配置到localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('message-columns', columns.toString())
    }
  }, [columns])

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }

  const scrollToTop = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0
    }
  }

  const clearAuthAndRedirect = (message?: string) => {
    socketService.disconnect()
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_type')
    setUserType(null)
    if (message) {
      toast.error(message)
    }
    router.push('/login')
  }

  // 登录检查和路由处理
  useEffect(() => {
    const inviteToken = searchParams.get('invite')
    const token = localStorage.getItem('auth_token')
    const storedUserType = localStorage.getItem('user_type')

    // 如果有邀请令牌，直接在主页完成访客登录
    if (inviteToken && !token) {
      const handleGuestLogin = async () => {
        try {
          const response = await fetch(`${getApiUrl()}/api/auth/guest/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ inviteToken })
          })

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.message || '邀请链接无效或已过期')
          }

          const data = await response.json()
          localStorage.setItem('auth_token', data.token)
          localStorage.setItem('user_type', data.type)
          setUserType(data.type)

          // 清除URL中的invite参数
          router.replace('/')
        } catch (err) {
          const error = err as Error
          toast.error(error.message || '访客登录失败')
          router.push('/login')
        }
      }

      handleGuestLogin()
      return
    }

    // 如果没有token且没有邀请，跳转到登录页
    if (!token) {
      router.push('/login')
      return
    }

    const tokenPayload = parseJwtPayload(token)
    if (!tokenPayload || isTokenExpired(tokenPayload)) {
      clearAuthAndRedirect('登录已过期，请重新登录')
      return
    }

    const resolvedUserType = tokenPayload.type || storedUserType
    if (!resolvedUserType) {
      clearAuthAndRedirect('登录状态异常，请重新登录')
      return
    }

    localStorage.setItem('user_type', resolvedUserType)
    setUserType(resolvedUserType as AppUserType)
  }, [searchParams, router])

  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    const storedUserType = localStorage.getItem('user_type')

    console.log('📍 Socket useEffect执行', {
      token: token ? `${token.substring(0, 20)}...` : 'null',
      userType: storedUserType
    })

    // 只有在已登录时才连接WebSocket（直接读localStorage，不依赖state）
    if (!token) {
      console.warn('⚠️ 未登录，跳过Socket连接', { hasToken: !!token, hasUserType: !!storedUserType })
      return
    }

    const tokenPayload = parseJwtPayload(token)
    if (!tokenPayload || isTokenExpired(tokenPayload)) {
      clearAuthAndRedirect('登录已过期，请重新登录')
      return
    }

    const resolvedUserType = (tokenPayload.type || storedUserType) as AppUserType | null
    if (!resolvedUserType) {
      clearAuthAndRedirect('登录状态异常，请重新登录')
      return
    }

    if (storedUserType !== resolvedUserType) {
      localStorage.setItem('user_type', resolvedUserType)
    }

    console.log('🎫 准备连接Socket...')

    // 连接WebSocket并传递token
    const socket = socketService.connect(token)

    socket.on('connect', () => {
      setConnected(true)
    })

    socket.on('disconnect', () => {
      setConnected(false)
    })

    // 接收历史消息
    socket.on('history', (history: Message[]) => {
      setMessages(history)
      setHistoryLoaded(true)
      setLoading(false)
      setTimeout(scrollToBottom, 100)
    })

    // 接收新消息
    socket.on('message', (message: Message) => {
      setMessages((prev) => [...prev, message])
      setTimeout(scrollToBottom, 100)
    })

    // 接收在线人数
    socket.on('onlineCount', (count: number) => {
      setOnlineCount(count)
    })

    const handleSocketError = (payload?: { message?: string }) => {
      if (payload?.message) {
        toast.error(payload.message)
      }
    }
    socket.on('error', handleSocketError)

    // 监听消息删除事件
    const handleMessagesDeleted = (deletedIds: string[]) => {
      setMessages((prev) => prev.filter((msg) => !deletedIds.includes(msg.id)))
      // 如果当前选中的消息被删除了，也从选中集合中移除
      setSelectedMessageIds((prev) => {
        const next = new Set(prev)
        deletedIds.forEach((id) => next.delete(id))
        return next
      })
    }
    socket.on('messagesDeleted', handleMessagesDeleted)

    // 监听被踢出事件
    const handleKicked = () => {
      socketService.disconnect()
      toast.error('您已被管理员移出当前会话，5秒后自动返回登录页', {
        duration: 5000
      })

      // 5秒后自动跳转
      setTimeout(() => {
        // 清除本地凭证
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user_type')
        router.push('/login')
      }, 5000)
    }
    socket.on('kicked', handleKicked)

    const handleAuthExpired = (payload?: { message?: string }) => {
      clearAuthAndRedirect(payload?.message || '登录已过期，请重新登录')
    }
    socket.on('authExpired', handleAuthExpired)

    // 设置超时，如果5秒后还没收到历史消息，也结束loading
    const timeout = setTimeout(() => {
      if (!historyLoaded) {
        setLoading(false)
      }
    }, 5000)

    return () => {
      clearTimeout(timeout)
      socket.off('error', handleSocketError)
      socket.off('messagesDeleted', handleMessagesDeleted)
      socket.off('kicked', handleKicked)
      socket.off('authExpired', handleAuthExpired)
      socketService.disconnect()
    }
  }, [userType])

  useEffect(() => {
    const handleScroll = () => {
      if (scrollRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
        const isAtTop = scrollTop < 200
        const isAtBottom = scrollTop + clientHeight >= scrollHeight - 200

        // 在顶部只显示down，在底部只显示up，在中间显示both
        if (isAtTop) {
          setShowScrollButtons('down')
        } else if (isAtBottom) {
          setShowScrollButtons('up')
        } else {
          setShowScrollButtons('both')
        }
      }
    }

    const element = scrollRef.current
    element?.addEventListener('scroll', handleScroll)
    return () => element?.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToMessage = (index: number) => {
    const messageElements = document.querySelectorAll('[data-message-index]')
    const targetElement = messageElements[index] as HTMLElement
    if (targetElement && scrollRef.current) {
      const elementTop = targetElement.offsetTop
      scrollRef.current.scrollTop = elementTop - 100
    }
  }

  const handleSearchNext = () => {
    if (searchResults.length === 0) return
    const nextIndex = (currentResultIndex + 1) % searchResults.length
    setCurrentResultIndex(nextIndex)
    scrollToMessage(searchResults[nextIndex])
  }

  const handleSearchPrev = () => {
    if (searchResults.length === 0) return
    const prevIndex = currentResultIndex === 0 ? searchResults.length - 1 : currentResultIndex - 1
    setCurrentResultIndex(prevIndex)
    scrollToMessage(searchResults[prevIndex])
  }

  // 监听 Ctrl+F 快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault()
        setSearchVisible(true)
      }
      if (e.key === 'Escape' && searchVisible) {
        setSearchVisible(false)
        setSearchQuery('')
        setSearchResults([])
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [searchVisible])

  // 搜索消息
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      setCurrentResultIndex(0)
      return
    }

    const query = searchQuery.toLowerCase()
    const results: number[] = []

    messages.forEach((msg, index) => {
      const content = msg.content?.toLowerCase() || ''
      const filename = msg.filename?.toLowerCase() || ''
      if (content.includes(query) || filename.includes(query)) {
        results.push(index)
      }
    })

    setSearchResults(results)
    setCurrentResultIndex(0)

    // 滚动到第一个结果
    if (results.length > 0) {
      scrollToMessage(results[0])
    }
  }, [searchQuery, messages])

  const handleSend = (type: string, content?: string, url?: string, filename?: string, fileSize?: number) => {
    const socket = socketService.getSocket()
    if (!socket) return

    const messageData: MessageDto = {
      type: type as 'text' | 'link' | 'image' | 'file',
      content,
      url,
      filename,
      fileSize
    }

    socket.emit('sendMessage', messageData)
  }

  const toggleSelectMode = () => {
    setIsSelectMode(!isSelectMode)
    setSelectedMessageIds(new Set())
  }

  const toggleMessageSelection = (id: string) => {
    setSelectedMessageIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleDeleteClick = () => {
    if (selectedMessageIds.size === 0) return
    setShowDeleteDialog(true)
  }

  const handleConfirmDelete = () => {
    const socket = socketService.getSocket()
    if (socket) {
      socket.emit('deleteMessages', Array.from(selectedMessageIds))
      setIsSelectMode(false)
      setSelectedMessageIds(new Set())
      setShowDeleteDialog(false)
    }
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current += 1
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current -= 1
    if (dragCounter.current === 0) {
      setIsDragging(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    dragCounter.current = 0

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files)
      messageInputRef.current?.addFiles(files)
      e.dataTransfer.clearData()
    }
  }

  return (
    <PhotoProvider>
      <div className="flex flex-col h-screen bg-background relative" onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop}>
        {/* 全局拖拽提示遮罩 */}
        {isDragging && (
          <div className="absolute inset-0 bg-background/80 z-[100] flex items-center justify-center pointer-events-none backdrop-blur-sm">
            <div className="flex flex-col items-center text-primary animate-bounce">
              <Upload className="h-16 w-16 mb-4" />
              <span className="text-xl font-medium">释放以上传文件</span>
            </div>
          </div>
        )}

        {/* 固定头部 */}
        <header className="fixed top-0 left-0 right-0 z-50 border-b px-4 py-2.5 flex items-center justify-between bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
          <div>
            <h1 className="text-lg font-bold">跨设备共享平台</h1>
            <p className="text-xs text-muted-foreground">实时同步链接、文本和文件</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={connected ? 'default' : 'secondary'} className="text-xs">
              {connected ? '已连接' : '未连接'}
            </Badge>

            {/* 在线用户 - 管理员可点击查看详情 */}
            {!isSelectMode &&
              (userType === 'admin' ? (
                <Badge variant="outline" className="gap-1 text-xs cursor-pointer hover:bg-secondary" onClick={() => setShowOnlineUsers(true)} title="点击查看在线用户详情">
                  <Users className="h-3 w-3" />
                  {onlineCount}
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1 text-xs">
                  <Users className="h-3 w-3" />
                  {onlineCount}
                </Badge>
              ))}

            {/* 搜索按钮 */}
            {!isSelectMode && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSearchVisible(true)} title="搜索消息 (Ctrl/Cmd+F)">
                <Search className="h-4 w-4" />
              </Button>
            )}

            {/* 更多菜单 - 所有用户可见，但选项不同 */}
            {isSelectMode && userType === 'admin' ? (
              <>
                <Button variant="destructive" size="icon" className="h-8 w-8" onClick={handleDeleteClick} disabled={selectedMessageIds.size === 0}>
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleSelectMode}>
                  <X className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {userType === 'admin' && <DropdownMenuItem onClick={() => setInviteOpen(true)}>生成邀请链接</DropdownMenuItem>}
                  <DropdownMenuItem onClick={() => setSettingsOpen(true)}>设置</DropdownMenuItem>
                  {userType === 'admin' && <DropdownMenuItem onClick={toggleSelectMode}>编辑消息</DropdownMenuItem>}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* 邀请链接生成器 - 仅管理员 */}
            {userType === 'admin' && <InviteLinkGenerator open={inviteOpen} onOpenChange={setInviteOpen} showTrigger={false} />}

            <SettingsDialog columns={columns} onColumnsChange={setColumns} open={settingsOpen} onOpenChange={setSettingsOpen} showTrigger={false} />
          </div>
        </header>

        {/* 搜索栏 */}
        <SearchBar
          visible={searchVisible}
          query={searchQuery}
          onQueryChange={setSearchQuery}
          onClose={() => {
            setSearchVisible(false)
            setSearchQuery('')
            setSearchResults([])
          }}
          onNext={handleSearchNext}
          onPrev={handleSearchPrev}
          currentIndex={currentResultIndex}
          totalResults={searchResults.length}
        />

        {/* 消息列表（可滚动区域）*/}
        <div ref={scrollRef} className="flex-1 overflow-y-auto pt-[68px] pb-[140px] px-4" style={{ scrollBehavior: 'smooth' }}>
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                <span>{connected ? '正在加载消息...' : '正在连接服务器...'}</span>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <p className="text-sm">还没有消息，发送第一条吧！</p>
            </div>
          ) : (
            <div
              className="max-w-7xl mx-auto py-4"
              style={{
                columnCount: columns,
                columnGap: '0.5rem'
              }}
            >
              {messages.map((message, index) => (
                <div key={message.id} data-message-index={index} className={`mb-2 break-inside-avoid ${searchResults.includes(index) && searchResults[currentResultIndex] === index ? 'ring-2 ring-primary rounded-xl' : ''}`}>
                  <MessageCard message={message} selectable={isSelectMode} selected={selectedMessageIds.has(message.id)} onSelect={() => toggleMessageSelection(message.id)} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 滚动快捷按钮 */}
        {showScrollButtons && (
          <div className="fixed right-4 bottom-[160px] flex flex-col gap-2 z-40">
            {(showScrollButtons === 'both' || showScrollButtons === 'up') && (
              <Button size="icon" variant="secondary" className="rounded-full shadow-lg" onClick={scrollToTop}>
                <ArrowUp className="h-4 w-4" />
              </Button>
            )}
            {(showScrollButtons === 'both' || showScrollButtons === 'down') && (
              <Button size="icon" variant="secondary" className="rounded-full shadow-lg" onClick={scrollToBottom}>
                <ArrowDown className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}

        {/* 固定底部输入区 */}
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <MessageInput ref={messageInputRef} onSend={handleSend} />
        </div>

        {/* 管理员专属：在线用户弹窗 */}
        {userType === 'admin' && <OnlineUsersModal socket={socketService.getSocket()} show={showOnlineUsers} onClose={() => setShowOnlineUsers(false)} />}

        {/* 删除确认弹窗 */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>确认删除消息？</AlertDialogTitle>
              <AlertDialogDescription>您即将删除选中的 {selectedMessageIds.size} 条消息。此操作将永久删除这些消息及相关文件，无法撤销。</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                确认删除
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PhotoProvider>
  )
}

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomeContent />
    </Suspense>
  )
}

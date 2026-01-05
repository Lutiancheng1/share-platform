'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Users, X } from 'lucide-react'
import { Socket } from 'socket.io-client'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'

interface OnlineUser {
  socketId: string
  userId: string
  userType: 'admin' | 'guest'
  ip: string
  device: string
  os: string
  browser: string
  connectedAt: string
  lastActiveAt: string
}

interface OnlineUsersModalProps {
  socket: Socket | null
  show: boolean
  onClose: () => void
}

export function OnlineUsersModal({ socket, show, onClose }: OnlineUsersModalProps) {
  const [users, setUsers] = useState<OnlineUser[]>([])

  useEffect(() => {
    if (!socket) return

    // 请求在线用户列表
    socket.emit('getOnlineUsers')

    // 监听在线用户更新
    const handleOnlineUsers = (data: OnlineUser[]) => {
      setUsers(data)
    }

    socket.on('onlineUsers', handleOnlineUsers)

    return () => {
      socket.off('onlineUsers', handleOnlineUsers)
    }
  }, [socket])

  const handleKickUser = (socketId: string) => {
    socket?.emit('kickUser', socketId)
  }

  const formatDuration = (dateString: string) => {
    const now = new Date().getTime()
    const then = new Date(dateString).getTime()
    const diff = Math.floor((now - then) / 1000)

    if (diff < 60) return `${diff}秒`
    if (diff < 3600) return `${Math.floor(diff / 60)}分钟`
    const hours = Math.floor(diff / 3600)
    const minutes = Math.floor((diff % 3600) / 60)
    return `${hours}小时${minutes}分钟`
  }

  return (
    <Dialog open={show} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            在线用户 ({users.length})
          </DialogTitle>
          <DialogDescription>当前连接到服务器的所有用户列表</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-2 pr-2">
          {users.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">暂无在线用户</p>
          ) : (
            users.map((user) => (
              <div key={user.socketId} className="border rounded-lg p-3 space-y-2 hover:bg-secondary/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{user.userType === 'admin' ? '👑' : '👤'}</span>
                    <div>
                      <p className="text-sm font-medium">{user.userType === 'admin' ? '管理员' : `访客 #${user.userId.slice(-6)}`}</p>
                      <p className="text-xs text-muted-foreground">在线 {formatDuration(user.connectedAt)}</p>
                    </div>
                  </div>

                  {user.userType !== 'admin' && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive" className="h-7 text-xs">
                          <X className="h-3 w-3 mr-1" />
                          踢出
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>确认踢出该用户？</AlertDialogTitle>
                          <AlertDialogDescription>该用户将被强制下线并清除登录状态，此操作无法撤销。</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>取消</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleKickUser(user.socketId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            确认踢出
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div>
                    <span className="font-medium">IP:</span> {user.ip}
                  </div>
                  <div>
                    <span className="font-medium">设备:</span> {user.device}
                  </div>
                  <div>
                    <span className="font-medium">系统:</span> {user.os}
                  </div>
                  <div>
                    <span className="font-medium">浏览器:</span> {user.browser}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

'use client'

import { Settings, Sun, Moon, Monitor } from 'lucide-react'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Label } from './ui/label'
import { RadioGroup, RadioGroupItem } from './ui/radio-group'

interface SettingsDialogProps {
  columns: number
  onColumnsChange: (columns: number) => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
  showTrigger?: boolean
}

import { useTheme } from 'next-themes'

// ...

export function SettingsDialog({ columns, onColumnsChange, open, onOpenChange, showTrigger = true }: SettingsDialogProps) {
  const { theme, setTheme } = useTheme()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {showTrigger && (
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="h-6 w-6 p-0">
            <Settings className="h-3 w-3" />
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>设置</DialogTitle>
          <DialogDescription>调整应用外观和布局</DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="space-y-3">
            <Label>主题模式</Label>
            <RadioGroup value={theme} onValueChange={setTheme} className="grid grid-cols-3 gap-4">
              <div>
                <RadioGroupItem value="light" id="theme-light" className="peer sr-only" />
                <Label htmlFor="theme-light" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                  <Sun className="h-6 w-6 mb-2" />
                  <span className="text-xs font-medium">浅色</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="dark" id="theme-dark" className="peer sr-only" />
                <Label htmlFor="theme-dark" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                  <Moon className="h-6 w-6 mb-2" />
                  <span className="text-xs font-medium">深色</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="system" id="theme-system" className="peer sr-only" />
                <Label htmlFor="theme-system" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                  <Monitor className="h-6 w-6 mb-2" />
                  <span className="text-xs font-medium">跟随系统</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <Label>消息列数（仅桌面端）</Label>
            <RadioGroup value={columns.toString()} onValueChange={(value) => onColumnsChange(parseInt(value))}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="1" id="col-1" />
                <Label htmlFor="col-1" className="cursor-pointer">
                  1列（默认）
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="2" id="col-2" />
                <Label htmlFor="col-2" className="cursor-pointer">
                  2列（紧凑）
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="3" id="col-3" />
                <Label htmlFor="col-3" className="cursor-pointer">
                  3列（极简）
                </Label>
              </div>
            </RadioGroup>
            <p className="text-xs text-muted-foreground">设置每行显示的消息数量，适用于宽屏设备</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

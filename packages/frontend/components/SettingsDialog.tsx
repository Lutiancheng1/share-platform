'use client'

import { Settings } from 'lucide-react'
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

export function SettingsDialog({ columns, onColumnsChange, open, onOpenChange, showTrigger = true }: SettingsDialogProps) {
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
          <DialogDescription>调整消息显示布局</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
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

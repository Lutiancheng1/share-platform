'use client'

import { Search, X, ChevronUp, ChevronDown } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'

interface SearchBarProps {
  visible: boolean
  query: string
  onQueryChange: (query: string) => void
  onClose: () => void
  onNext: () => void
  onPrev: () => void
  currentIndex: number
  totalResults: number
}

export function SearchBar({ visible, query, onQueryChange, onClose, onNext, onPrev, currentIndex, totalResults }: SearchBarProps) {
  if (!visible) return null

  return (
    <div className="fixed top-16 left-2 right-2 sm:left-auto sm:right-4 z-50 bg-background border rounded-lg shadow-lg p-2 flex items-center gap-1.5 sm:gap-2 max-w-full sm:max-w-md">
      <Search className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
      <Input type="text" placeholder="搜索..." value={query} onChange={(e) => onQueryChange(e.target.value)} className="h-7 sm:h-8 text-xs sm:text-sm flex-1 min-w-0" autoFocus />
      {totalResults > 0 && (
        <span className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
          {currentIndex + 1}/{totalResults}
        </span>
      )}
      <div className="flex gap-0.5 sm:gap-1 flex-shrink-0">
        <Button size="icon" variant="ghost" className="h-7 w-7 sm:h-8 sm:w-8" onClick={onPrev} disabled={totalResults === 0}>
          <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>
        <Button size="icon" variant="ghost" className="h-7 w-7 sm:h-8 sm:w-8" onClick={onNext} disabled={totalResults === 0}>
          <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>
      </div>
      <Button size="icon" variant="ghost" className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0" onClick={onClose}>
        <X className="h-3 w-3 sm:h-4 sm:w-4" />
      </Button>
    </div>
  )
}

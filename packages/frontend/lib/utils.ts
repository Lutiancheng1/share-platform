import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

import copy from 'copy-to-clipboard'

export async function copyToClipboard(text: string): Promise<boolean> {
  // 1. Try modern API first (if secure context)
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch (err) {
    console.warn('Navigator clipboard failed, trying fallback', err)
  }

  // 2. Try copy-to-clipboard library (handles most edge cases including HTTP)
  try {
    return copy(text, {
      debug: true,
      message: 'Press #{key} to copy'
    })
  } catch (err) {
    console.error('Library copy failed', err)
    return false
  }
}

export function getApiUrl() {
  if (typeof window !== 'undefined') {
    return `http://${window.location.hostname}:3001`
  }
  return 'http://localhost:3001'
}

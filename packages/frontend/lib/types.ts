export interface Message {
  id: string
  type: 'text' | 'link' | 'image' | 'file'
  content?: string
  url?: string
  filename?: string
  fileSize?: number
  createdAt: string
  userIp?: string
}

export interface MessageDto {
  type: 'text' | 'link' | 'image' | 'file'
  content?: string
  url?: string
  filename?: string
  fileSize?: number
}

// JWT Payload接口
export interface JwtPayload {
  type: 'admin' | 'guest'
  userId: string
  ip: string
  timestamp: number
  inviteToken?: string
  iat?: number
  exp?: number
}

// API错误响应
export interface ApiError {
  message: string
  statusCode?: number
  error?: string
}

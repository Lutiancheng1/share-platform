# 项目总览文档

## 📁 项目目录结构

```
share-platform/                      # 项目根目录
├── packages/                        # Monorepo 工作空间
│   ├── frontend/                   # Next.js 前端项目
│   │   ├── app/                    # Next.js 14 App Router
│   │   │   ├── page.tsx           # ✅ 主页（消息列表）
│   │   │   ├── login/             # ⏳ 登录页面（待实现）
│   │   │   ├── layout.tsx         # ✅ 全局布局
│   │   │   └── globals.css        # ✅ 全局样式
│   │   ├── components/             # React 组件
│   │   │   ├── MessageCard.tsx    # ✅ 消息卡片
│   │   │   ├── MessageInput.tsx   # ✅ 输入组件
│   │   │   ├── SearchBar.tsx      # ✅ 搜索栏
│   │   │   ├── SettingsDialog.tsx # ⏳ 设置面板（待实现）
│   │   │   └── ui/                # ✅ shadcn/ui 组件（已安装）
│   │   ├── lib/                    # 工具库
│   │   │   ├── socket.ts          # ✅ WebSocket 客户端
│   │   │   ├── types.ts           # ✅ TypeScript 类型定义
│   │   │   └── utils.ts           # ✅ 工具函数
│   │   ├── public/                 # 静态资源
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── tailwind.config.ts
│   │
│   └── backend/                    # NestJS 后端项目
│       ├── src/
│       │   ├── gateway/           # ✅ WebSocket 网关
│       │   │   └── chat.gateway.ts
│       │   ├── modules/           # ✅ 功能模块
│       │   │   ├── auth/         # ✅ 认证模块
│       │   │   ├── message/      # ✅ 消息模块
│       │   │   └── upload/       # ✅ 文件上传
│       │   ├── entities/          # ✅ 数据实体
│       │   │   └── message.entity.ts
│       │   ├── dto/               # ✅ 数据传输对象
│       │   │   └── message.dto.ts
│       │   ├── guards/            # ⏳ 路由守卫（待完善）
│       │   │   └── auth.guard.ts
│       │   ├── app.module.ts      # ✅ 根模块
│       │   └── main.ts            # ✅ 入口文件
│       ├── uploads/               # ✅ 文件存储目录
│       ├── test/
│       ├── package.json
│       └── tsconfig.json
│
├── docker-compose.yml              # ✅ Docker 编排配置
├── package.json                    # ✅ 根 package.json (workspaces)
├── .env                            # ✅ 环境变量（已配置）
├── .env.example                    # ✅ 环境变量模板
├── .gitignore                      # ✅ Git 忽略文件
├── README.md                       # ✅ 项目说明文档
├── QUICKSTART.md                   # ✅ 快速开始指南
├── PROJECT_OVERVIEW.md             # ✅ 项目总览（本文档）
└── start.sh                        # ✅ 一键启动脚本
```

**图例**：

- ✅ 已完成
- ⏳ 待实现
- ❌ 不在计划内

---

## 🎯 项目边界说明

### ✅ 核心功能范围

1. **实时消息同步**
   - 文本消息发送/接收
   - URL 链接分享（可点击跳转）
   - 图片上传/预览/下载
   - 小文件传输（< 2MB 或 10MB）
   - **粘贴上传**（Ctrl/Cmd+V 直接粘贴图片和文件）

2. **访问控制**
   - 登录认证（密码验证）
   - JWT Token 管理（7天有效期）
   - Token 存储（localStorage）
   - 清除所有登录功能

3. **数据存储**
   - PostgreSQL 永久存储全量消息
   - Redis 缓存最近 100 条消息（待实现）
   - 文件本地存储（uploads 目录）

4. **用户体验**
   - 响应式设计（手机/平板/桌面）
   - 实时更新（WebSocket）
   - 图片预览弹窗
   - 一键复制功能
   - **智能导航按钮**（根据滚动位置智能显示）
   - **全文搜索**（Ctrl/Cmd+F 搜索消息内容）
   - **加载状态提示**（连接中/加载中）

---

### ❌ 不在范围内的功能

1. **不支持的功能**
   - ❌ 多用户权限管理（只有单一访问密码）
   - ❌ 用户注册/账号系统
   - ❌ 消息加密（端到端加密）
   - ❌ 语音/视频通话
   - ❌ 群组/频道概念
   - ❌ @提及、消息回复等社交功能

2. **文件限制**
   - ❌ 不支持大文件（> 10MB）
   - ❌ 不支持视频实时预览
   - ❌ 不支持文件夹上传

3. **高级功能**
   - ❌ 消息编辑/删除（仅管理员可清空全部）
   - ❌ 消息标签/分类
   - ❌ 离线消息推送

---

## 🎨 需求与实现方式

### 需求 1：电脑 → 手机 快速分享测试链接

**需求描述**：  
开发时需要将电脑上的测试 URL（如 `http://192.168.1.100:8080/test`）快速发送到手机浏览器测试。

**实现方式**：

```
1. 电脑端：打开 http://your-server-ip:3000
2. 粘贴测试链接到输入框 → 点击发送
3. WebSocket 实时广播到所有在线设备
4. 手机端：立即显示链接，点击直接跳转
5. 支持一键复制链接按钮
```

**技术细节**：

- 前端：识别 URL 格式（正则表达式），渲染为可点击链接
- 后端：WebSocket `emit('message')` 广播
- 延迟：< 200ms

---

### 需求 2：图片直接预览和下载

**需求描述**：  
上传截图后，能在列表中预览缩略图，点击查看原图，支持下载。

**实现方式**：

```
1. 上传：拖拽图片或点击选择文件
2. 前端发送 FormData 到 /api/upload
3. 后端保存到 uploads/ 目录，返回 URL
4. WebSocket 广播消息（type: 'image', url: '/uploads/xxx.png'）
5. 前端渲染：
   - 列表：<img> 缩略图（max-height: 256px）
   - 点击：Dialog 弹窗显示原图
   - 下载：<a href={url} download> 按钮
```

**技术细节**：

- shadcn/ui Dialog 组件
- multer 文件上传中间件
- 图片压缩（可选，1M 带宽启用）

---

### 需求 3：登录认证（7天免登录）

**需求描述**：  
首次访问需要输入密码，之后 7 天内无需重复登录。

**实现方式**：

```
1. 访问主页 → 检查 localStorage 是否有 Token
2. 无 Token → 重定向到 /login
3. 输入密码 → 后端验证（env: ACCESS_PASSWORD）
4. 验证成功 → 生成 JWT Token（有效期 7d）
5. 前端存储 Token → localStorage.setItem('auth_token', token)
6. 后续请求自动携带 Authorization 头
```

**Token 内容**：

```json
{
  "ip": "192.168.1.100",
  "timestamp": 1735552800000,
  "exp": 1736157600
}
```

**安全策略**：

- 密码：16位随机字符（openssl rand -base64 16）
- JWT 密钥：32位随机 Hex（openssl rand -hex 32）
- Token 过期后自动跳转登录页

---

### 需求 4：清除所有登录

**需求描述**：  
管理员可以使所有设备的 Token 失效，强制重新登录。

**实现方式**（方案选择）：

**方案 A（简化版）**：重启后端服务

```bash
# Token 包含 JWT 签名，重启后 JWT_SECRET 不变，Token 仍然有效
# 需要配合 Redis 黑名单
```

**方案 B（推荐）**：Token 黑名单机制

```typescript
// 设置面板点击"清除所有登录"
async clearAllTokens() {
  // Redis 记录"全局失效时间戳"
  await redis.set('token:invalidate_before', Date.now());
}

// 每次验证 Token 时检查
if (tokenTimestamp < invalidateBeforeTimestamp) {
  throw new UnauthorizedException('Token 已失效');
}
```

**实现细节**：

- 前端：设置面板添加"清除所有登录"按钮
- 后端：`/auth/invalidate-all` 接口
- 立即生效，所有设备下次请求时被拒绝
- 前端检测到 401 错误 → 清除 localStorage → 跳转登录页

---

## 🔧 实现步骤（开发顺序）

### 阶段 1：后端基础 ✅ 已完成

1. ✅ 初始化 NestJS 项目
2. ✅ 安装依赖：`@nestjs/typeorm` `pg` `ioredis` `@nestjs/jwt` `@nestjs/websockets` `socket.io` `multer`
3. ✅ 配置数据库连接（TypeORM）
4. ✅ 创建 Message 实体
5. ✅ 实现认证模块（AuthModule）
6. ✅ 实现 JWT 守卫（AuthGuard）
7. ✅ 创建 WebSocket Gateway
8. ✅ 实现文件上传接口

### 阶段 2：前端基础 ✅ 已完成

1. ✅ 初始化 Next.js 项目
2. ✅ 安装 shadcn/ui：`npx shadcn-ui@latest init`
3. ✅ 安装组件：`button card dialog scroll-area textarea input tabs badge skeleton`
4. ✅ 安装 socket.io-client
5. ⏳ 创建登录页面（/login）- 待实现
6. ✅ 实现 Token 管理（基础）
7. ✅ 配置 WebSocket 客户端
8. ✅ 创建主页布局

### 阶段 3：核心功能 ✅ 已完成

1. ✅ 实现消息发送/接收（WebSocket）
2. ✅ 创建 MessageCard 组件（渲染不同类型）
3. ✅ 创建 MessageInput 组件（文本 + 文件）
4. ✅ 实现图片预览功能（Dialog）
5. ✅ 实现文件上传逻辑
6. ✅ 添加复制按钮（navigator.clipboard）
7. ✅ 实时更新消息列表

### 阶段 4：优化与测试 🔄 进行中

1. ✅ 响应式样式调整（部分完成）
2. ⏳ 添加设置面板 - 待实现
3. ⏳ 实现"清除所有登录" - 待实现
4. ⏳ Docker 配置和测试 - 部分完成
5. ⏳ 多端测试（电脑 + 手机）- 待测试
6. ⏳ 性能优化（消息分页加载）- 待实现

### 阶段 5：额外功能 ✅ 已完成

1. ✅ 智能导航按钮（根据滚动位置显示）
2. ✅ 粘贴上传功能（Ctrl/Cmd+V）
3. ✅ 全文搜索（Ctrl/Cmd+F）
4. ✅ 加载状态提示
5. ✅ UI 紧凑化优化

**总计：约 10-13 小时** → **实际已投入：约 8 小时**  
**剩余工作量：2-3 小时**

---

## 🔐 环境变量配置

参考 `.env.example` 文件，需要配置：

```bash
# 生成访问密码
openssl rand -base64 16
# 输出示例: xK7mP9vR3qL2wN8sT4yU5z==

# 生成 JWT 密钥
openssl rand -hex 32
# 输出示例: a3f8d7e9c2b1a6f5e4d3c2b1a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0

# 写入 .env 文件
echo "ACCESS_PASSWORD=xK7mP9vR3qL2wN8sT4yU5z==" > .env
echo "JWT_SECRET=a3f8d7e9c2b1a6f5e4d3c2b1a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0" >> .env
```

---

## 🚀 当前状态与下一步

### ✅ 已完成

- 前后端项目结构创建完成
- 环境变量已配置（`.env` 文件）
- 所有依赖已安装
- Docker 容器已运行（PostgreSQL + Redis）
- 核心实时通信功能完整
- UI/UX 优化到位（5个亮点功能）

### ⏳ 待完成

1. **登录页面**（1小时）
   - 创建 `/login` 路由
   - 密码验证表单
   - Token 存储和跳转

2. **Redis 缓存**（1小时）
   - 集成 ioredis
   - 实现消息双写
   - Token 黑名单机制

3. **设置面板**（1小时）
   - IP 白名单管理
   - 清除所有登录功能

4. **多端测试**（1小时）
   - 手机端适配
   - 跨设备实时同步验证

### 📝 快速开始

```bash
# 项目已就绪，直接启动即可
cd /Users/lutiancheng/Downloads/share-platform
./start.sh

# 或手动启动
cd packages/frontend && npm run dev
cd packages/backend && npm run start:dev
```

访问：<http://localhost:3000>

---

## 📞 技术支持

如遇到问题，可查看：

- `README.md` - 项目说明
- `implementation_plan.md` - 详细技术方案
- `access_control_analysis.md` - 访问控制分析

---

**项目创建时间**：2025-12-30  
**预计完成时间**：2-3 天（兼职开发）

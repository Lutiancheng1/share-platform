# 快速开始指南

## 🚀 一键启动

### 方式1：使用启动脚本（推荐）

```bash
cd /Users/lutiancheng/Downloads/share-platform

# 复制环境变量模板
cp .env.example .env

# 编辑 .env 设置密码（必须！）
# 修改 ACCESS_PASSWORD=你的密码

# 一键启动（自动切换到 Node 20）
./start.sh
```

### 方式2：手动启动

```bash
# 1. 切换到 Node 20
nvm use 20

# 2. 启动数据库
docker-compose up -d postgres redis

# 3. 启动后端
cd packages/backend
npm run start:dev

# 4. 新终端启动前端
cd packages/frontend  
nvm use 20
npm run dev
```

## 📱 访问地址

- **前端**: http://localhost:3000
- **后端 API**: http://localhost:3001/api
- **WebSocket**: ws://localhost:3001

## 🔐 首次使用

1. 打开 `.env` 文件
2. 设置 `ACCESS_PASSWORD=你的密码`（当前是 test123）
3. 可选：修改 `JWT_SECRET`（使用 `openssl rand -hex 32` 生成）
4. 启动项目
5. 电脑和手机浏览器都访问 http://localhost:3000
6. 开始发送消息！

## ✨ 功能演示

### 1. 发送测试链接
- 在输入框粘贴：`https://www.example.com/test`
- 点击发送
- 手机端立即显示，点击链接直接跳转

### 2. 发送图片
- 点击"图片"按钮
- 选择图片
- 点击发送
- 图片实时显示，可查看原图和下载

### 3. 发送文本
- 输入任意文本
- Ctrl/Cmd + Enter 快速发送
- 支持一键复制

## 🛠️ 开发命令

```bash
# 后端
cd packages/backend
nvm use 20
npm run start:dev    # 开发模式（热重载）
npm run build        # 构建
npm run start        # 生产模式

# 前端
cd packages/frontend
nvm use 20
npm run dev          # 开发模式
npm run build        # 构建
npm run start        # 生产模式
```

## 📦 生产部署

```bash
# 使用 Docker Compose
docker-compose up -d

# 访问
# 前端: http://your-server-ip:3000
# 后端: http://your-server-ip:3001
```

## ⚠️ 注意事项

1. **Node 版本**: 必须使用 Node 20+（使用 `nvm use 20`）
2. **数据库**: 必须先启动 PostgreSQL 和 Redis
3. **环境变量**: 必须配置 .env 文件（复制自 .env.example）
4. **防火墙**: 确保 3000 和 3001 端口开放

## 🐛 常见问题

### Q: 前端无法连接后端？
A: 检查 `.env` 中的 `NEXT_PUBLIC_WS_URL` 是否正确

### Q: 数据库连接失败？
A: 确保 Docker 中的 PostgreSQL 已启动：`docker-compose ps`

### Q: 文件上传失败？
A: 检查 `packages/backend/uploads` 目录是否存在

## 📚 项目文档

- [README.md](./README.md) - 完整项目说明
- [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md) - 技术细节和开发指南
- [implementation_plan.md](./.gemini/antigravity/brain/*/implementation_plan.md) - 实现方案

## 🎯 下一步

- 手机使用4G/5G网络时，将 `NEXT_PUBLIC_WS_URL` 改为服务器公网IP
- 设置复杂密码增强安全性
- 配置 Nginx 反向代理（参考 PROJECT_OVERVIEW.md）

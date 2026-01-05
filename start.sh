#!/bin/bash

# 跨设备共享平台启动脚本

echo "🚀 正在启动跨设备共享平台..."
echo ""

# 确保脚本在项目根目录执行
cd "$(dirname "$0")"

# 检查Node版本
echo "✅ 切换到 Node 20..."
source ~/.nvm/nvm.sh
nvm use 20

# 检查环境变量
if [ ! -f ".env" ]; then
  if [ -f ".env.example" ]; then
    echo "⚠️  未找到 .env 文件，从 .env.example 复制..."
    cp .env.example .env
    echo "📝 请编辑 .env 文件，设置 ACCESS_PASSWORD 和 JWT_SECRET"
  else
    echo "⚠️  未找到 .env.example 文件，跳过环境变量配置"
  fi
  echo ""
fi

# 启动数据库（Docker）
echo "🐳 启动 PostgreSQL 和 Redis..."
docker-compose up -d postgres redis

# 等待数据库启动
echo "⏳ 等待数据库就绪..."
sleep 5

# 启动后端
echo "🔧 启动后端服务..."
(cd packages/backend && nvm use 20 && npm run start:dev) &
BACKEND_PID=$!

# 启动前端
echo "🎨 启动前端服务..."
(cd packages/frontend && nvm use 20 && npm run dev) &
FRONTEND_PID=$!

echo ""
echo "============================================"
echo "✅ 服务启动成功！"
echo "============================================"
echo "📱 前端地址: http://localhost:3000"
echo "🔌 后端地址: http://localhost:3001"
echo "📡 WebSocket: ws://localhost:3001"
echo ""
echo "按 Ctrl+C 停止服务"
echo "============================================"

# 等待用户中断
wait

# Share Platform 接力文档

最后更新：2026-03-13

## 项目定位

- 项目名：`share-platform`
- 项目类型：代码项目，按 `Git + PROJECT_SYNC.md` 接力
- 本地目录：`/Users/lutiancheng/Downloads/share-platform`
- 远端仓库：`https://github.com/Lutiancheng1/share-platform.git`
- 技术栈：`Next.js + NestJS + Socket.IO + PostgreSQL + Redis`

## 当前主线

这是一个跨设备共享平台，主线不是继续扩产品形态，而是把部署方式、容器化、实时通信、上传链路和公网部署稳定性收口。当前历史记录已经明确过：部署时优先本地构建后上传，不要在目标服务器上硬 build 造成卡死。

## 最近一次接力来源

- 归档会话：`019cad51-5834-7aa3-abf1-388b9cd0bd4a`
- 历史 handoff：`/Users/lutiancheng/openclaw-workspace/workspace-hub/projects/share-platform/session-archive/019cad51-5834-7aa3-abf1-388b9cd0bd4a/handoff.md`
- 项目内现有文档：`README.md`、`PROJECT_OVERVIEW.md`、`QUICKSTART.md`

## 当前已知基线

- 前端是 `Next.js 14 App Router`
- 后端是 `NestJS + Socket.IO`
- 文件上传、图片预览、文本消息、实时同步链路已经存在
- Docker Compose 部署方案已经存在
- 历史记录里已明确修过部署方式与 502/代理误判问题
- 新服务器部署主线与上传模块、前端消息输入组件、聊天网关相关

## 当前未收口重点

1. 部署脚本和 Docker 化方案继续收口
2. 公网部署与反向代理链路继续稳定
3. 上传链路与实时消息联动继续验证
4. 前端 socket 与工具函数改动继续联调
5. 文档与真实部署方式保持一致

## 接手顺序

1. 先读 `PROJECT_SYNC.md`
2. 再读 `README.md`
3. 再读 `PROJECT_OVERVIEW.md` 与 `QUICKSTART.md`
4. 最后按任务进入 `packages/frontend/` 或 `packages/backend/`

## 关键文件

- `docker-compose.yml`
- `deploy.sh`
- `packages/frontend/Dockerfile`
- `packages/frontend/lib/socket.ts`
- `packages/frontend/lib/utils.ts`
- `packages/backend/src/modules/upload/upload.module.ts`
- `packages/backend/src/gateway/chat.gateway.ts`

## 同步规则

- 跨机器接力时，以仓库代码 + 本文件为准
- 部署相关变更完成后，要同步更新本文件或项目总览文档
- `.env` 不进仓库，配置变更写进 `.env.example` 或文档

## 本次备注

- 本轮工作树里已经有未提交的部署与运行链路改动
- 这次提交会把这些现有改动和本文件一起收口成一个可继续接力的 git 基线

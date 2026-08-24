# AI 创作站

纯前端 AI 生图 / 生视频工具站：文生图、图生图、多图合成、视频生成（文生视频 / 首尾帧控制 / 图片参考）、提示词优化。用户自备 [Agnes AI](https://www.agnes-ai.cn/zh-Hans/docs/overview) API Key（BYOK），密钥与生成历史仅保存在浏览器本地，不设管理后台、不落库。

对应设计文档见 [`../docs`](../docs)：[需求文档](../docs/需求文档.md) · [网页设计文档](../docs/网页设计文档.md) · [API接口文档](../docs/API接口文档.md)。低保真线框图见 [`../wireframes`](../wireframes)。

## 技术栈

- React 18 + TypeScript + Vite + Tailwind CSS
- Zustand（全局状态：设置 / 历史 / 任务 / 提示）
- React Router（客户端路由）
- 各平台原生 Edge Function 作为无状态代理层（见「架构」）

## 本地开发

```bash
npm install
npm run dev
```

首次打开后前往「设置」页填入 Agnes API Key（默认 Base URL 已预设为 `https://api.agnes-ai.cn/v1`），点击「测试连接」确认可用即可开始创作。

```bash
npm run build    # 类型检查 + 生产构建，产物在 dist/
npm run preview  # 本地预览构建产物
npm run lint     # 仅类型检查
```

## 架构

```
浏览器 SPA  →  /api/agnes/*（同域 Edge Function，无状态代理） →  api.agnes-ai.cn
```

- **为什么要代理层**：Agnes API 是否对浏览器开放 CORS 未在官方文档中确认；代理层同时统一做请求前置校验（如视频 `size` 必须 `720P`、参考图不超过 5 张）与错误包装。若后续确认 CORS 完全开放，可将 `src/lib/http.ts` 中的路由逻辑改为直连，代理层保留作为可选增强。
- **无状态**：代理层（`src/server/proxy-core.ts`）只做请求透传 + 参数校验，不记录、不缓存、不持久化任何请求体、响应体或 Authorization 头。
- **密钥与历史数据流向**：API Key 使用 WebCrypto AES-GCM 加密后存于 `localStorage`；生成历史（含缩略图/完整参数）存于 `IndexedDB`。两者都只在用户自己的浏览器里，代理层和本仓库代码都不会把它们发送到除 Agnes 官方 API 之外的任何地方。

### 目录结构

```
src/
  lib/
    providers/        # 模型服务商适配层（见下方「扩展新的模型服务商」）
    storage/           # localStorage（设置）+ IndexedDB（历史）封装
    http.ts            # 统一 fetch 封装：代理 or 直连路由、SSE 流式解析、错误归一化
    crypto.ts           # API Key 本地加密
  store/               # zustand 全局状态
  components/          # 通用 UI / 图标 / 布局 / 工作台专用组件
  pages/               # 路由页面（首页 / 工作台四个子页 / 任务中心 / 画廊 / 设置）
  server/proxy-core.ts # 三平台共享的代理核心逻辑
functions/api/agnes/[[path]].ts   # Cloudflare Pages Functions 入口
api/agnes/[...path].ts            # Vercel Edge Function 入口
netlify/edge-functions/proxy.ts   # Netlify Edge Function 入口
```

## 部署

三个平台使用同一份代码库，构建命令均为 `npm run build`，产物目录均为 `dist`。

### Cloudflare Pages

1. 新建 Pages 项目，关联本仓库
2. Build command: `npm run build`　Build output directory: `dist`
3. `functions/api/agnes/[[path]].ts` 会被自动识别为 Pages Functions，无需额外配置
4. （可选）如果用 `wrangler pages deploy` 命令行部署，已提供 `wrangler.toml`

### Vercel

1. Import 本仓库，框架预设选择 "Vite"
2. Build command: `npm run build`　Output directory: `dist`
3. `api/agnes/[...path].ts` 会被自动识别为 Edge Function（已在文件内声明 `export const config = { runtime: "edge" }`）
4. `vercel.json` 已配置 SPA 回退规则（`/api/*` 之外的路径都指向 `index.html`）

### Netlify

1. 新建站点，关联本仓库
2. `netlify.toml` 已声明构建命令 / 产物目录 / Edge Function 路由（`/api/agnes/*` → `netlify/edge-functions/proxy.ts`）与 SPA 回退规则
3. 无需额外手动配置，直接部署即可

## 扩展新的模型服务商

所有页面/组件只通过 `getActiveProvider()`（`src/lib/providers/index.ts`）调用模型能力，不直接引用 Agnes 的接口细节。要接入第二个服务商：

1. 在 `src/lib/providers/` 新建 `xxxProvider.ts`，实现 `ModelProvider` 接口（`src/lib/providers/types.ts`）：`text.streamChat`、`image.generateImage`、`video.createVideoTask` / `queryVideoTask`、`testConnection`
2. 在 `providers/index.ts` 的 registry 中注册
3. 如需要新增的边缘代理路由，仿照 `src/server/proxy-core.ts` 的模式新增一段路由分发（不必修改三个平台的入口文件）

页面、状态管理（`useImageGenerator` / `useTaskStore` / `usePromptEnhancer`）都不需要改动。

## 联调验证记录

[API接口文档.md](../docs/API接口文档.md) 中原先标记「待联调验证」的两点，已用真实 API Key 实测：

1. **视频任务响应字段** —— ✅ 已确认。创建任务与查询任务的真实响应里，`status`/`progress`/`url`/`error` 均为顶层字段，`in_progress` 状态值也和 `agnesProvider.ts` 里 `normalizeStatus` 的映射完全一致，**未做任何代码改动**。文本（含流式 SSE）、文生图、图生图、多图合成、视频创建到轮询完成的全链路均已实测跑通。
2. **`api.agnes-ai.cn` 的浏览器端 CORS 支持情况** —— 未直接验证（只测试过经由本项目自带代理层的调用路径，这也是当前实际部署使用的路径）。代理层工作稳定，暂无必要为了验证这一点去掉代理；如果以后需要更轻量的纯静态部署，可以单独测试直连再决定是否降级代理为可选项。

## 已实现的体验细节

- 深色 / 浅色主题切换（CSS 变量驱动，跟随系统偏好或记住手动选择，刷新不闪烁）
- 视频任务持久化到 IndexedDB：创建后即使刷新页面、关闭标签页也不会丢失，重新打开会自动恢复轮询进行中的任务
- 历史画廊使用瀑布流（CSS 多列）布局展示缩略图，预览大图做等比例缩放，不会因为图片是竖版/宽幅而被裁切

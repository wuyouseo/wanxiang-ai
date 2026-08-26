# 万象 AI

AI 生图 / 生视频工具站：文生图、图生图、多图合成、视频生成（文生视频 / 首尾帧控制 / 图片参考）、提示词优化。用户自备 [Agnes AI](https://www.agnes-ai.cn/zh-Hans/docs/overview) API Key（BYOK），API Key 始终只保存在浏览器本地，不设管理后台。生成历史默认也只存在浏览器本地（IndexedDB）；登录后（邮箱验证链接，Supabase Auth）会自动同步到云端，换设备/换浏览器也能看到，见下方「云同步」。

对应设计文档见 [`../docs`](../docs)：[需求文档](../docs/需求文档.md) · [网页设计文档](../docs/网页设计文档.md) · [API接口文档](../docs/API接口文档.md)。低保真线框图见 [`../wireframes`](../wireframes)。

## 技术栈

- React 18 + TypeScript + Vite + Tailwind CSS
- Zustand（全局状态：设置 / 历史 / 任务 / 提示 / 账号）
- React Router（客户端路由）
- 各平台原生 Edge Function 作为无状态代理层（见「架构」）
- Supabase（可选云同步：Auth + Postgres + Storage，见「云同步」）

## 本地开发

```bash
npm install
npm run dev
```

首次打开后前往「设置」页填入 Agnes API Key（默认 Base URL 已预设为 `https://api.agnes-ai.cn/v1`），点击「测试连接」确认可用即可开始创作。

若要在本地也启用云同步，复制 `.env.local.example`（或直接新建 `.env.local`）并填入 Supabase 项目的 URL 与 anon key，见下方「云同步」一节。不配置这两个变量时，云同步相关 UI 会自动隐藏，其余功能不受影响。

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
- **密钥与历史数据流向**：API Key 使用 WebCrypto AES-GCM 加密后存于 `localStorage`，永远不离开浏览器、不上传云端。生成历史未登录时存于 `IndexedDB`（同样只在本机）；登录后改为读写 Supabase，见下方「云同步」。

## 云同步（可选，基于 Supabase）

不登录也能完整使用本站；登录（邮箱验证链接，不设密码）后，新生成的图片/视频会自动：

1. 通过 `/api/agnes/relay-image`（复用同一份 Edge Function 代理，见上方架构图）把 Agnes 返回的素材同域下载下来——避免直接从浏览器 fetch 第三方域名可能遇到的 CORS 问题；
2. 上传到 Supabase Storage 的 `artworks` 桶（按 `<user_id>/<记录id>.<ext>` 分文件夹），换成本站自己长期有效的链接——避免 Agnes 官方链接过期后历史记录里的图挂掉；
3. 把这条记录（含永久链接、prompt、生成参数）写入 Supabase `history_items` 表，通过 Row Level Security 保证每个人只能读写自己的数据。

### 接入步骤

1. 在 [Supabase](https://supabase.com/dashboard) 建一个项目，拿到 **Project URL** 和 **anon / public key**（Project Settings → API；不要用 `service_role`，那是服务端专用密钥）。
2. 打开该项目的 SQL Editor，把 [`supabase/schema.sql`](supabase/schema.sql) 的内容粘贴进去并 Run —— 会建好 `history_items` 表、RLS 策略、`artworks` Storage 桶。可以安全地重复执行。
3. 打开 Authentication → URL Configuration，把 Site URL（以及 Redirect URLs，如两者不同）设为你实际部署的域名（如 `https://xxx.netlify.app`），否则登录邮件里的链接点击后会跳转失败。
4. 本地开发：在 `webapp/` 下新建 `.env.local`（参考 `.env.local.example`），填入第 1 步拿到的两个值。
5. 生产部署：在部署平台（Netlify: Site configuration → Environment variables；Vercel/Cloudflare 同理）新增同名的两个环境变量，重新触发一次构建。

不配置这两个环境变量时，登录相关 UI 会自动隐藏，其余功能（含本地历史）不受影响。

### 目录结构

```
src/
  lib/
    providers/        # 模型服务商适配层（见下方「扩展新的模型服务商」）
    storage/           # localStorage（设置）+ IndexedDB（历史，未登录时用）+ Supabase（历史，登录后用）封装
    supabase.ts        # Supabase client 单例
    http.ts            # 统一 fetch 封装：代理 or 直连路由、SSE 流式解析、错误归一化
    crypto.ts           # API Key 本地加密
  store/               # zustand 全局状态（含 useAuthStore）
  components/
    auth/              # 登录/账号面板（TopNav 弹窗 + 设置页共用）
    ...                # 通用 UI / 图标 / 布局 / 工作台专用组件
  pages/               # 路由页面（首页 / 工作台四个子页 / 任务中心 / 画廊 / 设置）
  server/proxy-core.ts # 三平台共享的代理核心逻辑（含 handleImageRelay）
functions/api/agnes/[[path]].ts   # Cloudflare Pages Functions 入口
api/agnes/[...path].ts            # Vercel Edge Function 入口
netlify/edge-functions/proxy.ts   # Netlify Edge Function 入口
supabase/schema.sql                # 云同步所需的表结构 / RLS 策略 / Storage 桶，见「云同步」
```

## 部署到托管平台（详细教程）

三个平台使用同一份代码库，构建命令均为 `npm run build`，产物目录均为 `dist`。三者都是「关联 Git 仓库 → 自动构建部署」的模式，所以第一步都一样：先把代码推送到 GitHub。

> ⚠️ **本仓库的根目录是 `docs/` `wireframes/` `webapp/` 三个文件夹的上一级**，而真正要部署的 Vite 项目在 `webapp/` 子目录里（`package.json` 在这里）。所以下面每个平台在配置时，都要把 **Root Directory / Base directory 设为 `webapp`**，这是最容易漏掉、也是构建失败最常见的原因，务必留意。

### 第 0 步：把代码推送到 GitHub（三个平台通用前提）

1. 打开 [github.com](https://github.com)，登录后点右上角 `+` → **New repository**
2. 填仓库名（例如 `ai-studio`），**不要**勾选 "Add a README file" / ".gitignore" / "license"（本地已经有提交了，勾选会导致推送冲突），选择 Public 或 Private 均可，点 **Create repository**
3. 创建成功后，GitHub 会显示一段命令，在本项目根目录（`README.md` 所在的这一级，不是 `webapp/`）执行：

   ```bash
   git remote add origin https://github.com/<你的用户名>/<仓库名>.git
   git branch -M main
   git push -u origin main
   ```

4. 如果推送时要求登录，GitHub 网页密码已不支持直接推送，需要用 [Personal Access Token](https://github.com/settings/tokens) 代替密码，或者装 [GitHub Desktop](https://desktop.github.com/) 用图形界面登录后推送。

推送成功后，GitHub 仓库页面能看到 `docs/`、`wireframes/`、`webapp/` 三个文件夹，就说明这一步完成了。

---

### 方式一：部署到 Cloudflare Pages

1. 打开 [dash.cloudflare.com](https://dash.cloudflare.com)，注册/登录账号
2. 左侧菜单进入 **Workers & Pages** → 点 **Create application** → 切到 **Pages** 标签 → **Connect to Git**
3. 授权 Cloudflare 访问 GitHub，选择刚才推送的仓库，点 **Begin setup**
4. 在构建配置页填写：
   - **Project name**：自定义，会成为默认域名的一部分（`<name>.pages.dev`）
   - **Production branch**：`main`
   - **Framework preset**：选 `Vite`（没有的话选 `None` 手动填下面两项）
   - **Build command**：`npm run build`
   - **Build output directory**：`dist`
   - 展开 **Root directory (advanced)**，填 **`webapp`** ← 关键一步
5. 点 **Save and Deploy**，等待 1～2 分钟构建完成
6. 构建成功后会给一个 `https://<name>.pages.dev` 的地址，`functions/api/agnes/[[path]].ts` 会被自动识别为 Pages Functions，无需额外配置
7. （可选）在项目的 **Custom domains** 标签页绑定自己的域名
8. （可选）也可以用命令行部署：`cd webapp && npx wrangler pages deploy dist`（已提供 `wrangler.toml`）

### 方式二：部署到 Vercel

1. 打开 [vercel.com](https://vercel.com)，可以直接用 GitHub 账号登录（会顺带完成授权）
2. Dashboard 页点 **Add New...** → **Project**
3. 在 Import 列表里找到刚才的仓库，点 **Import**（如果没看到，点 "Adjust GitHub App Permissions" 补充授权）
4. 在配置页：
   - **Framework Preset**：Vercel 通常会自动识别成 `Vite`
   - 点击 **Root Directory** 右侧的 **Edit**，选择 **`webapp`** ← 关键一步
   - Build Command / Output Directory 保持默认（`npm run build` / `dist`，Vite 预设已经对好）
5. 点 **Deploy**，等待构建完成
6. 完成后会给一个 `https://<project>.vercel.app` 的地址，`api/agnes/[...path].ts` 会被自动识别为 Edge Function（文件内已声明 `export const config = { runtime: "edge" }`），`vercel.json` 里配置的 SPA 回退规则也会自动生效
7. （可选）在 **Settings → Domains** 绑定自定义域名

### 方式三：部署到 Netlify

1. 打开 [app.netlify.com](https://app.netlify.com)，注册/登录
2. 点 **Add new site** → **Import an existing project** → 选 **GitHub** → 授权 → 选择仓库
3. 在配置页：
   - **Base directory**：填 **`webapp`** ← 关键一步
   - **Build command**：`npm run build`
   - **Publish directory**：`dist`（相对于 Base directory，也就是实际的 `webapp/dist`）
4. 点 **Deploy site**，等待构建完成
5. 完成后会给一个 `https://<random-name>.netlify.app` 的地址；`webapp/netlify.toml` 里声明的 Edge Function 路由（`/api/agnes/*` → `netlify/edge-functions/proxy.ts`）和 SPA 回退规则会在 Base directory 生效后自动读取，无需额外手动配置
6. （可选）在 **Site configuration → Domain management** 绑定自定义域名，或在 **Site name** 里改一个好记的默认子域名

---

### 部署后自检清单

无论用哪个平台，部署完成后按这个顺序验证一遍：

1. 打开分配到的域名，确认首页能正常打开（Landing 页正常渲染）
2. 前往「设置」页填入你的 Agnes API Key，点 **测试连接** —— 这一步能同时验证「前端能访问」和「Edge Function 代理能正常转发请求」两件事，是最关键的检查点
3. 试着在「文生图」里生成一张图，确认完整链路（前端 → 代理函数 → Agnes API → 返回图片）没问题

### 常见问题排查

| 现象 | 大概率原因 |
|---|---|
| 构建失败，提示找不到 `package.json` 或 `vite` 命令 | Root Directory / Base directory 没填 `webapp`，平台在仓库根目录找构建脚本，自然找不到 |
| 页面能打开，但「测试连接」提示网络错误 | 打开浏览器开发者工具的 Network 面板，看 `/api/agnes/...` 请求的响应；如果是 404，说明 Edge Function 没被正确识别部署，去对应平台的 Functions/Edge Functions 面板确认是否列出了这个函数，一般还是 Root/Base Directory 没配对 |
| 页面路由刷新后 404（比如直接访问 `/settings` 报 404） | Cloudflare 检查 `webapp/public/_redirects` 是否被打包进 `dist/`；Vercel 检查 `webapp/vercel.json` 是否生效；Netlify 检查 `webapp/netlify.toml` 的 `[[redirects]]` 是否生效 |
| 以后想去掉这层子目录结构，部署配置更省心 | 可以把 `webapp/` 整个目录单独建一个新仓库推送，这样三个平台都不需要再配置 Root/Base Directory 了 |

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

# 万象 AI

在线 AI 生图 / 生视频工具站：文生图、图生图、多图合成、视频生成（文生视频 / 首尾帧控制 / 图片参考），并内置基于文本模型的提示词优化。纯前端、无管理后台，用户自备 [Agnes AI](https://www.agnes-ai.cn/zh-Hans/docs/overview) API Key（BYOK），密钥与生成历史仅保存在浏览器本地。

## 目录结构

| 目录 | 内容 |
|---|---|
| [`docs/`](docs) | 需求文档、网页设计文档、Agnes API 接口文档（整理版） |
| [`wireframes/`](wireframes) | 低保真线框图（10 屏，含桌面端与移动端），可发布为交互式画布查看 |
| [`webapp/`](webapp) | 可直接部署到 Cloudflare Pages / Vercel / Netlify 的完整前端源码 |

## 从这里开始

- 想了解产品定位、功能范围、非功能需求 → 看 [docs/需求文档.md](docs/需求文档.md)
- 想了解视觉设计、页面布局、技术架构决策 → 看 [docs/网页设计文档.md](docs/网页设计文档.md)
- 想了解 Agnes 三个模型（文本/图像/视频）的具体接口参数 → 看 [docs/API接口文档.md](docs/API接口文档.md)
- 想跑起来看效果、部署上线、扩展新的模型服务商 → 看 [webapp/README.md](webapp/README.md)

## 快速启动

```bash
cd webapp
npm install
npm run dev
```

打开后前往「设置」页填入 Agnes API Key 即可开始创作。完整部署教程（含推送到 GitHub、Cloudflare Pages / Vercel / Netlify 三平台详细步骤、常见问题排查）见 [webapp/README.md](webapp/README.md#部署到托管平台详细教程)。

## 项目状态

网站全部核心功能（文生图、图生图、多图合成、视频生成三模式、提示词优化、历史画廊、任务中心、设置中心）已实现并用真实 API Key 完整联调验证通过，可直接部署使用。设计阶段产出的需求/设计文档与线框图作为过程资料保留在 `docs/` 与 `wireframes/`，供后续迭代参考。

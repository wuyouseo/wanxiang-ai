# Agnes AI 开发接口文档（整理版）

> 本文档基于 Agnes AI 官方文档整理（2026-08-24 抓取；2026-09-29 增补新一代文本 / 图像模型），供本项目前端 / Edge Function 代理层开发调用参考。
> 官方文档：
> - 平台总览：https://www.agnes-ai.cn/zh-Hans/docs/overview
> - 文本模型（新一代）：https://www.agnes-ai.cn/zh-Hans/docs/agnes-30-flash
> - 文本模型（上一代）：https://www.agnes-ai.cn/zh-Hans/docs/agnes-25-flash
> - 图像模型（新一代）：https://www.agnes-ai.cn/zh-Hans/docs/agnes-image-25-flash
> - 图像模型（上一代）：https://www.agnes-ai.cn/zh-Hans/docs/agnes-image-21-flash
> - 视频模型：https://www.agnes-ai.cn/zh-Hans/docs/agnes-video-25-flash
> - 全量文档索引：https://wiki.agnes-ai.cn/llms.txt
>
> ⚠️ 官方文档未明确列出的字段（主要是视频任务查询的完整响应结构、通用错误码表）已在文中标注【待联调验证】，开发联调时以实际返回为准，并回填本文档。

---

## 0. 平台总览

Agnes AI 是统一的多模态模型服务平台，覆盖**文本 / 图像 / 视频 / 多模态理解**，接口风格**兼容 OpenAI**（文本另外还提供 Anthropic 兼容的 Messages API）。

### Base URL
```
https://api.agnes-ai.cn/v1
```

### 认证方式
除 Messages API（Anthropic 兼容）外，统一使用 Bearer Token：
```
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
```

Messages API 使用 Anthropic 风格请求头：
```
x-api-key: YOUR_API_KEY
anthropic-version: 2023-06-01
Content-Type: application/json
```

### API Key 安全提示（官方原文）
不要在以下场景暴露 API Key：公开代码仓库、前端客户端代码、截图/录屏、公开文档、他人可访问的配置文件。

> 这一点对本项目意义重大：本项目是"用户自带 Key（BYOK）"的纯前端应用，Key 只能留在用户本地，不能硬编码、不能上传到我们控制的任何服务器持久化。详见《需求文档》《网页设计文档》中的密钥安全方案。

---

## 1. 文本模型 — Agnes 3.0 Flash（新一代，默认推荐）

模型 ID：`agnes-3.0-flash`。新一代文本模型，重点强化指令遵循、上下文遵循、工具调用（Function Calling）与任务编排能力；输入除文本外还支持图像 URL（多模态理解）。

上一代 `agnes-2.5-flash` 与前代 `agnes-2.0-flash` 仍可用，作兼容回退；三套接口（Chat Completions / Responses / Messages）对 3.0 与 2.5 参数完全一致，切换仅改 `model` 字段。

上下文窗口 `512K`，最大输出 `65.5K`（65,536 Token）。

当前计费：输入/输出 Token **限时 ¥0/百万 Token**（原价：输入 ¥0.35、输出 ¥1.00、输入缓存命中 ¥0.035，按百万 Token 计）。

提供三套等价接口，本项目**默认使用 Chat Completions API**（生态最成熟、SDK/文档最多）；预留 Responses API / Messages API 作为可切换的高级选项。

### 1.1 Chat Completions API（主用）

```
POST /v1/chat/completions
```

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| model | string | 是 | `agnes-3.0-flash`（回退可用 `agnes-2.5-flash`） |
| messages | array | 是 | `system` / `user` / `assistant`；`content` 可为字符串或含 `text` + `image_url` 的内容块数组 |
| temperature | number | 否 | 越低越确定 |
| top_p | number | 否 | 核采样 |
| max_tokens | number | 否 | 最大输出 token |
| stream | boolean | 否 | 流式输出，前端用于打字机效果 |
| tools / tool_choice | array/object | 否 | 函数调用（**Agnes 3.0 正式支持**，响应从 `choices[].message.tool_calls` 读取；本项目暂不需要，预留） |
| chat_template_kwargs.enable_thinking | boolean | 否 | 开启 Thinking 模式（用于复杂提示词分析场景） |

图像理解（Agnes 3.0 支持在 `content` 数组中传入 `{"type":"image_url","image_url":{"url": "..."}}`，图片须为公开可访问 URL；可用于"以图生图前先分析参考图内容"等增强功能，暂列为二期能力）。

**请求示例（用于"提示词优化"功能）**
```bash
curl https://api.agnes-ai.cn/v1/chat/completions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "agnes-3.0-flash",
    "messages": [
      { "role": "system", "content": "你是专业的AI绘画提示词工程师，请将用户输入改写为更适合文生图模型的英文提示词，补充画面细节、光影、构图、风格关键词。" },
      { "role": "user", "content": "一只猫在窗边看雨" }
    ],
    "temperature": 0.7,
    "max_tokens": 512,
    "stream": true
  }'
```

**响应格式**
```json
{
  "id": "chatcmpl_xxx",
  "object": "chat.completion",
  "created": 1774432125,
  "model": "agnes-3.0-flash",
  "choices": [{
    "index": 0,
    "message": { "role": "assistant", "content": "……" },
    "finish_reason": "stop"
  }],
  "usage": { "prompt_tokens": 35, "completion_tokens": 58, "total_tokens": 93 }
}
```

### 1.2 Responses API（备选）
```
POST /v1/responses
```
参数：`model`、`input`（字符串或结构化数组）、`max_output_tokens`。响应体含 `status`、`output[]`（从 `type` 为 `message` 的项读取文本，`output_text` 内容块）、`usage`、`error`、`incomplete_details`。适合需要区分 `reasoning` / `message` 分段输出的场景。

### 1.3 Messages API（Anthropic 兼容，备选）
```
POST /v1/messages
```
参数：`model`、`max_tokens`（必填）、`messages`、`system`、`temperature`、`stream`。使用 `x-api-key` 鉴权。

### 1.4 Thinking 模式
- OpenAI 兼容：`"chat_template_kwargs": {"enable_thinking": true}`
- Anthropic 兼容：`"thinking": {"type": "enabled", "budget_tokens": 2048}`

本项目在"提示词优化"功能中默认**关闭** Thinking（追求低延迟），作为设置项开放给高级用户。

---

## 2. 图像模型 — Agnes Image 2.5 Flash（新一代，默认推荐）

模型 ID：`agnes-image-2.5-flash`。新一代图像模型，整体能力全面超过上一代 Image 2.1 Flash，重点优化高信息密度图像、复杂视觉细节与语义对齐（编辑、构图、细节、提示词遵循）。

**接入方式与 `agnes-image-2.1-flash` 完全兼容**：端点、参数、尺寸、计费结构一致，切换仅改 `model` 字段；2.1 仍可用作回退。图生图同样不需要传 `tags: ["img2img"]`（历史遗留参数已废弃）。

```
POST /v1/images/generations
```

同一接口通过是否传入 `image` 数组，覆盖**文生图 / 图生图 / 多图合成**三种模式：

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| model | string | 是 | `agnes-image-2.5-flash`（回退可用 `agnes-image-2.1-flash`） |
| prompt | string | 是 | 生成/编辑指令 |
| size | string | 是 | 推荐档位 `1K`/`2K`/`3K`/`4K`；也兼容精确尺寸如 `1024x768`（不支持的尺寸会被自动规整） |
| ratio | string | 否，默认 `1:1` | `1:1`/`3:4`/`4:3`/`16:9`/`9:16`/`2:3`/`3:2`/`21:9` |
| extra_body.image | string[] | 图生图/多图合成必填 | 输入图数组：公网 HTTPS URL 或 Data URI Base64；**不传即为文生图** |
| extra_body.response_format | `"url"` \| `"b64_json"` | 否 | ⚠️ 必须放在 `extra_body` 内，不能放顶层 |
| return_base64 | boolean | 否 | 文生图场景下的 Base64 输出快捷开关 |

**尺寸对照表（Image 2.5 Flash 官方全表）**

| Ratio | 1K | 2K | 3K | 4K |
|---|---|---|---|---|
| 1:1 | 1024×1024 | 2048×2048 | 3072×3072 | 4096×4096 |
| 3:4 | 864×1152 | 1728×2304 | 2592×3456 | 3456×4608 |
| 4:3 | 1152×864 | 2304×1728 | 3456×2592 | 4608×3456 |
| 16:9 | 1312×736 | 2624×1472 | 3936×2208 | 5248×2944 |
| 9:16 | 736×1312 | 1472×2624 | 2208×3936 | 2944×5248 |
| 2:3 | 832×1248 | 1664×2496 | 2496×3744 | 3328×4992 |
| 3:2 | 1248×832 | 2496×1664 | 3744×2496 | 4992×3328 |
| 21:9 | 1568×672 | 3136×1344 | 4704×2016 | 6272×2688 |

> 注意：`1920x1080` / `2560x1440` 等非常见尺寸不是原生档位，会被映射规整（如 `1920x1080` → 16:9 1K 的 `1312x736`）。需要标准 16:9 显示素材时，建议请求 `size: "2K"` + `ratio: "16:9"`（输出 2624×1472）后自行裁剪。

**三种模式请求示例**

文生图：
```json
{
  "model": "agnes-image-2.5-flash",
  "prompt": "A luminous floating city above a misty canyon at sunrise, cinematic realism",
  "size": "1024x768",
  "extra_body": { "response_format": "url" }
}
```

图生图（在 `extra_body.image` 传 1 张图）：
```json
{
  "model": "agnes-image-2.5-flash",
  "prompt": "Transform the scene into a rain-soaked cyberpunk night, preserve original composition",
  "size": "1024x768",
  "extra_body": {
    "image": ["https://example.com/input-image.png"],
    "response_format": "url"
  }
}
```

多图合成（`extra_body.image` 传 2 张及以上）：
```json
{
  "model": "agnes-image-2.5-flash",
  "prompt": "Combine the two characters into an intense fantasy battle scene",
  "size": "1024x768",
  "extra_body": {
    "image": ["https://example.com/character-1.png", "https://example.com/character-2.png"],
    "response_format": "url"
  }
}
```

**响应格式**
```json
{
  "created": 1780000000,
  "data": [{ "url": "https://storage.googleapis.com/agnes-aigc/xxx.png", "b64_json": null, "revised_prompt": null }]
}
```

**关键约束（易错点，务必在代理层校验）**
- `response_format` 只能出现在 `extra_body` 内，顶层传会报错。
- 不要传 `tags: ["img2img"]`（历史遗留参数，官方明确禁止）。
- 图生图 / 多图合成的输入图必须是**公网可访问的 HTTPS URL** 或 **Data URI Base64**——用户在浏览器本地上传的图片若不转 Base64，Agnes 服务端无法访问，因此本项目上传图片一律转 `data:image/...;base64,...`。
- 多图合成前 3 张输入图免费，第 4 张起收费（¥0.02/张）——前端 UI 需限制默认最多引导 3 张，超过时提示。
- 计费按输出分辨率分档（刊例价）：1K ¥0.07/张、2K ¥0.12/张、3K ¥0.14/张、4K ¥0.16/张；**当前限时全部 ¥0/张**。
- 生成耗时数秒到几十秒不等，客户端（代理层/前端 fetch）超时建议设置为 **60s–360s**，过短会误报超时。

---

## 3. 视频模型 — Agnes Video 2.5 Flash

模型 ID：`agnes-video-2.5-flash`。**异步任务模式**：创建任务后轮询查询接口获取结果。

### 3.1 创建任务
```
POST /v1/videos
```

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| model | string | 是 | `agnes-video-2.5-flash` |
| prompt | string | 是 | 视频内容描述 |
| mode | string | 是 | `text` \| `keyframe` \| `reference` |
| seconds | string | 否，默认 `"5"` | 时长 `"4"`~`"12"` |
| size | string | 否，默认 `"720P"` | **Flash 固定 720P**，传其他值 400 报错 |
| aspect_ratio | string | 否，默认 `16:9` | `21:9`/`16:9`/`4:3`/`1:1`/`3:4`/`9:16` |
| seed | integer | 否 | 随机种子 |
| n | integer | 否，默认 1 | 当前仅支持 1 |
| first_frame / last_frame | string | keyframe 模式用 | 首帧/尾帧图片 URL |
| images | string[] | reference 模式用，**最多 5 张** | 参考图 URL 列表 |
| audios | string[] | reference 模式可选 | 参考音频 URL |
| videos | object[] | — | **Flash 不支持**，传入即 400 |

**分辨率对照（size 固定 720P，实际像素由 aspect_ratio 决定）**

| aspect_ratio | 像素 |
|---|---|
| 16:9 | 1280×720 |
| 9:16 | 720×1280 |
| 1:1 | 720×720 |
| 4:3 | 960×720 |
| 3:4 | 720×960 |
| 21:9 | 1680×720 |

**三种模式请求示例**

文生视频：
```json
{
  "model": "agnes-video-2.5-flash",
  "prompt": "雨后的未来城市街道，霓虹灯倒映在地面，一辆银色跑车缓慢驶过，电影级运镜",
  "seconds": "5",
  "mode": "text",
  "size": "720P",
  "aspect_ratio": "16:9"
}
```

首尾帧控制：
```json
{
  "model": "agnes-video-2.5-flash",
  "prompt": "人物从首帧姿态自然转身走向窗边，镜头缓慢推进并平滑过渡到尾帧",
  "seconds": "5",
  "mode": "keyframe",
  "size": "720P",
  "first_frame": "https://example.com/first.png",
  "last_frame": "https://example.com/last.png"
}
```

图片参考生成：
```json
{
  "model": "agnes-video-2.5-flash",
  "prompt": "以 <Picture 1> 中的角色和美术风格为参考，角色在花田中自然奔跑，保持外观一致",
  "seconds": "5",
  "mode": "reference",
  "size": "720P",
  "aspect_ratio": "16:9",
  "images": ["https://example.com/character.png"]
}
```

创建任务成功后应返回任务 ID（如 `video_id` / `id`，字段名以联调实测为准）。

### 3.2 查询任务
```
GET /agnesapi?video_id=<VIDEO_ID>&model_name=agnes-video-2.5-flash
```
- text 模式可省略 `model_name`；`keyframe` / `reference` 模式**必须**带 `model_name`。
- 建议轮询间隔 **1–2 秒**，直至 `status` 为 `completed` 或 `failed`。
- 【待联调验证】完整响应字段：官方文档未给出完整 JSON 示例，仅说明含 `status`（`pending`/`processing`/`completed`/`failed`）与失败时的错误详情；成功时应含视频下载 URL 字段。开发时先用真实 Key 跑一次并将实际响应结构补充进本文档，前端按"未知字段兜底展示 + 关键字段（status、url类）容错解析"处理。

### 3.3 Flash 专属错误（HTTP 400）

| 触发条件 | 响应体 |
|---|---|
| `size` 非 720P | `{"detail": "size must be 720P"}` |
| `images` 超过 5 张 | `{"detail": "images length must not exceed 5"}` |
| 传入 `videos` | `{"detail": "videos is not supported"}` |

校验失败的请求不会创建任务、不产生费用——代理层应在请求发出前做**同款前置校验**，直接在前端拦截，减少无效请求和用户等待。

### 3.4 计费
时长计费，原价 ¥0.15/秒，**当前限时 ¥0/秒**。

---

## 4. 通用集成注意事项

1. **CORS【待验证】**：官方文档未说明 `api.agnes-ai.cn` 是否对浏览器端直连开放 CORS。本项目按"不假设 CORS 可用"设计，统一通过项目自带的 Edge Function 轻代理转发请求（详见《网页设计文档》"技术架构"一节）；若联调确认 CORS 开放，可退化为纯前端直连，代理层作为可选增强保留（用于流式转发、请求前置校验、统一错误包装）。
2. **图片输入统一 Base64 化**：无论是图生图 / 多图合成的输入图，还是视频 keyframe / reference 的输入图，用户在本项目里都是从本地上传或从历史画廊选取，前端统一转换为 `data:` Base64 URI 后再发送，避免依赖任何第三方图床。
3. **错误处理**：非 2xx 响应统一按 `{"detail" | "error": "..."}` 结构解析并展示为可读的用户提示（额度不足/Key 无效/参数超限/服务超时四类做专门文案）。
4. **限时免费**：文本 / 图像 / 视频当前均为限时 ¥0 计费，产品内应提示"当前生成免费，价格可能随官方策略调整"，避免用户误以为永久免费。
5. **流式与轮询的 UI 落地**：文本流式 → 打字机效果；图像同步等待 → 生成中骨架屏；视频异步轮询 → 任务卡片 + 进度状态 + 可后台运行、完成后通知。

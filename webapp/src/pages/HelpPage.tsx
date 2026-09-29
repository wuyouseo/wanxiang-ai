import { Link } from "react-router-dom";
import { Icon, type IconName } from "../components/icons/Icon";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { AccordionItem } from "../components/ui/Accordion";

const sectionNav = [
  { href: "#quick-start", label: "快速开始" },
  { href: "#tutorials", label: "功能教程" },
  { href: "#api-key", label: "API Key 配置" },
  { href: "#faq", label: "常见问题" },
];

const quickStart = [
  { title: "获取 Agnes API Key", desc: "访问 Agnes AI 官网注册账号并创建一个 API Key" },
  { title: "在「设置」中粘贴 Key", desc: "进入设置中心粘贴 Key，点击「测试连接」确认可用" },
  { title: "选择创作方式", desc: "在「创作工作台」选择文生图 / 图生图 / 多图合成 / 视频生成" },
  { title: "输入描述并生成", desc: "编写提示词（或用 AI 优化），设置好参数后点击生成" },
];

const tutorials: { icon: IconName; title: string; steps: string[] }[] = [
  {
    icon: "image",
    title: "文生图怎么用",
    steps: [
      "在提示词框里描述你想要的画面，越具体效果越好（可以加上光线、构图、风格关键词）",
      "提示词不够专业？点「优化提示词」，AI 会实时改写，满意后点「采用」再替换原文",
      "选择尺寸（1K～4K）和比例（1:1 到 21:9 共 8 种），下方会实时显示预计输出像素",
      "点击「生成图片」，完成后可以下载、收藏、复制提示词，或直接「以此图继续图生图」进入下一轮创作",
    ],
  },
  {
    icon: "image",
    title: "图生图怎么用",
    steps: [
      "拖拽、点击或直接粘贴剪贴板图片来上传参考图，也可以在右侧「最近生成」里点「设为输入图」",
      "用提示词描述要如何修改这张图，或直接点「更换背景」「改变风格」等快捷标签插入常用描述",
      "尺寸、比例参数用法和文生图一致",
    ],
  },
  {
    icon: "layers",
    title: "多图合成怎么用",
    steps: [
      "上传 2 张及以上图片（默认引导最多 3 张，超过会提示可能产生额外费用，但不会强制拦截）",
      "上传后可以拖拽调整顺序，每张图左上角会显示对应序号",
      "在提示词中用 <Picture 1>、<Picture 2> 引用对应序号的图片，描述要如何组合它们",
    ],
  },
  {
    icon: "video",
    title: "视频生成怎么用",
    steps: [
      "顶部切换三种模式：「文生视频」纯文字描述生成；「首尾帧控制」上传首帧和尾帧图片，描述过渡动作；「图片参考」上传最多 5 张参考图，保持角色或风格一致",
      "设置时长（4～12 秒）和画幅比例，视频分辨率固定 720P",
      "点击「生成视频」后任务会自动进入「任务中心」排队生成，期间可以离开去做别的创作，不会中断",
      "即使中途刷新页面或关掉标签页，任务也不会丢失，重新打开会自动恢复跟踪进度，完成后自动存入历史画廊",
    ],
  },
];

const apiKeySteps = [
  { title: "什么是 Agnes API Key", desc: "本站所有生成功能都由 Agnes AI 提供，你需要在 Agnes 官网注册并创建一个属于自己的 API Key，才能开始创作。" },
  { title: "在设置页填入 Key", desc: "打开「设置」页，在「API Key 配置」区域粘贴你的 Key。Base URL 已经预设好 Agnes 官方地址，一般不需要修改。" },
  { title: "测试连接", desc: "点击「测试连接」按钮，看到「已连接」就说明配置成功，可以直接前往创作工作台开始生成。" },
  { title: "更换或重新配置", desc: "想换一个 Key？直接回到设置页重新粘贴、覆盖保存即可，不需要任何「退出登录」操作。" },
];

const faqs = [
  {
    q: "生成失败，提示「API Key 无效或未授权」怎么办？",
    a: "先回到「设置」页确认 Key 有没有输错或漏粘贴空格，点一次「测试连接」重新验证。如果 Key 本身没问题，也可能是 Agnes 服务端的临时错误，稍等片刻再试一次。",
  },
  {
    q: "视频任务一直显示「排队中」正常吗？",
    a: "正常。排队时长取决于 Agnes 服务器当前负载，不需要一直守着页面——可以先去做别的创作，完成后任务会自动更新状态并存入历史画廊。",
  },
  {
    q: "多图合成为什么提示「可能产生额外费用」？",
    a: "按 Agnes 的计费策略，多图合成前 3 张参考图免费，第 4 张起可能收费，具体以 Agnes 官方最新定价为准，本站不会额外拦截或加价。",
  },
  {
    q: "换了浏览器或清空了缓存，之前的作品还在吗？",
    a: "不在了。历史记录只保存在当时那个浏览器本地（IndexedDB），换设备或清除浏览器数据都会丢失。建议定期在「历史画廊」或「设置」的数据管理里导出 JSON 备份。",
  },
  {
    q: "支持哪些浏览器？",
    a: "建议使用最新版 Chrome、Edge、Safari 或 Firefox。功能依赖浏览器原生的 WebCrypto（密钥加密）和 IndexedDB（本地存储），现代浏览器都已默认支持。",
  },
  {
    q: "手机上能正常创作吗？",
    a: "可以，界面针对手机做了单栏布局和底部导航适配，参数区可以折叠，生成入口常驻底部，随时随地都能用。",
  },
];

export function HelpPage() {
  return (
    <div className="mx-auto max-w-4xl px-5 py-8 md:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">帮助中心</h1>
        <p className="mt-1 text-sm text-text-muted">使用教程、API Key 配置说明与常见问题</p>
      </div>

      <div className="mb-10 flex flex-wrap gap-2">
        {sectionNav.map((n) => (
          <a
            key={n.href}
            href={n.href}
            className="focus-ring rounded-full border border-border-subtle bg-black/[0.015] px-3.5 py-1.5 text-sm text-text-secondary transition-colors hover:border-border-strong hover:text-text-primary dark:bg-white/[0.02]"
          >
            {n.label}
          </a>
        ))}
      </div>

      <section id="quick-start" className="mb-14 scroll-mt-20">
        <h2 className="mb-5 text-lg font-semibold">快速开始</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {quickStart.map((s, i) => (
            <Card key={s.title} className="flex gap-3.5 p-5">
              <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-accent-gradient text-xs font-bold text-white">
                {i + 1}
              </span>
              <div>
                <h3 className="text-sm font-semibold text-text-primary">{s.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-text-muted">{s.desc}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section id="tutorials" className="mb-14 scroll-mt-20">
        <h2 className="mb-5 text-lg font-semibold">功能教程</h2>
        <div className="flex flex-col gap-4">
          {tutorials.map((t) => (
            <Card key={t.title} className="p-5">
              <div className="mb-3 flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-control bg-accent-violet/10 text-accent-violet">
                  <Icon name={t.icon} size={16} />
                </span>
                <h3 className="text-sm font-semibold text-text-primary">{t.title}</h3>
              </div>
              <ol className="flex flex-col gap-2 pl-1">
                {t.steps.map((step, i) => (
                  <li key={i} className="flex gap-2.5 text-xs leading-relaxed text-text-secondary">
                    <span className="flex-shrink-0 text-text-muted">{i + 1}.</span>
                    {step}
                  </li>
                ))}
              </ol>
            </Card>
          ))}
        </div>
      </section>

      <section id="api-key" className="mb-14 scroll-mt-20">
        <h2 className="mb-5 text-lg font-semibold">API Key 配置指南</h2>
        <Card className="p-5">
          <div className="mb-4 flex items-start gap-3 rounded-control border border-border-subtle bg-black/[0.015] p-4 dark:bg-white/[0.02]">
            <Icon name="key" size={18} className="mt-0.5 flex-shrink-0 text-text-secondary" />
            <p className="text-xs leading-relaxed text-text-secondary">
              还没有 API Key？
              <a
                href="https://www.agnes-ai.cn/zh-Hans/docs/overview"
                target="_blank"
                rel="noreferrer"
                className="mx-1 text-accent-violet hover:underline"
              >
                前往 Agnes AI 官网获取 →
              </a>
            </p>
          </div>
          <div className="flex flex-col gap-4">
            {apiKeySteps.map((s, i) => (
              <div key={s.title} className="flex gap-3.5">
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-border-strong text-xs font-semibold text-text-secondary">
                  {i + 1}
                </span>
                <div>
                  <h3 className="text-sm font-medium text-text-primary">{s.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-text-muted">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 flex items-start gap-3 border-t border-border-subtle pt-4">
            <Icon name="lock" size={18} className="mt-0.5 flex-shrink-0 text-text-secondary" />
            <p className="text-xs leading-relaxed text-text-secondary">
              安全性说明：Key 会通过浏览器原生的 WebCrypto 加密后保存在本地，不会上传到本站或任何第三方服务器；清除浏览器数据后需要重新配置。
            </p>
          </div>
          <div className="mt-5">
            <Link to="/settings">
              <Button variant="primary" icon="gear">
                前往设置页配置
              </Button>
            </Link>
          </div>
        </Card>
      </section>

      <section id="faq" className="scroll-mt-20">
        <h2 className="mb-5 text-lg font-semibold">常见问题</h2>
        <Card className="px-5">
          {faqs.map((f) => (
            <AccordionItem key={f.q} question={f.q} answer={f.a} />
          ))}
        </Card>
      </section>
    </div>
  );
}

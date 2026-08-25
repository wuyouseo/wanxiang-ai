import { Link } from "react-router-dom";
import { Icon, type IconName } from "../components/icons/Icon";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { ThemeToggle } from "../components/ui/ThemeToggle";
import { Logo } from "../components/layout/Logo";
import { Footer } from "../components/layout/Footer";
import { AccordionItem } from "../components/ui/Accordion";

const navLinks = [
  { href: "#features", label: "功能特点" },
  { href: "#how-it-works", label: "使用流程" },
  { href: "#faq", label: "常见问题" },
];

const capabilities = [
  { icon: "image" as const, title: "文生图", desc: "输入文字描述即可生成图片，支持 1:1 到 21:9 共 8 种比例、1K 到 4K 四档分辨率" },
  { icon: "image" as const, title: "图生图", desc: "上传参考图，AI 按提示词编辑风格、背景与光影，保留你想保留的构图" },
  { icon: "layers" as const, title: "多图合成", desc: "组合多张图片，用 <Picture 1> <Picture 2> 引用序号，生成全新的融合场景" },
  { icon: "video" as const, title: "视频生成", desc: "文生视频、首尾帧控制、图片参考，三种模式覆盖不同创作需求" },
];

const steps = [
  { title: "配置 API Key", desc: "前往设置页粘贴你的 Agnes API Key，仅加密保存在本地浏览器，点击「测试连接」确认可用" },
  { title: "选择创作方式", desc: "文生图 / 图生图 / 多图合成 / 视频生成，四种模式在工作台里随时切换" },
  { title: "描述你的创意", desc: "输入提示词，或一键调用 AI 把简单描述改写成专业提示词，可编辑后再采用" },
  { title: "生成并保存", desc: "实时查看生成结果，收藏、下载或复用参数再创作，历史记录自动留在本地" },
];

const advantages: { icon: IconName; title: string; desc: string }[] = [
  {
    icon: "lock",
    title: "数据仅存本地",
    desc: "API Key 加密保存在浏览器，生成历史存在 IndexedDB，本站没有后台数据库，创作内容不会经过我们的服务器留存",
  },
  {
    icon: "sparkle",
    title: "AI 提示词优化",
    desc: "一句话描述，AI 帮你补全成专业级提示词，流式生成实时可见，采用前还能自己再编辑",
  },
  {
    icon: "tasks",
    title: "任务永不丢失",
    desc: "视频生成是异步任务，创建后自动持久化到本地，即使刷新页面或关掉标签页也能恢复跟踪进度",
  },
  {
    icon: "grid",
    title: "瀑布流历史画廊",
    desc: "每张图片、视频都按真实比例完整展示，不会被裁切，支持收藏、复用参数、导出 JSON 备份",
  },
  {
    icon: "reuse",
    title: "参数一键复用",
    desc: "对生成结果满意？点一下就能把提示词、尺寸、参考图原样带回工作台，微调后再生成",
  },
  {
    icon: "sun",
    title: "深浅色 · 全端适配",
    desc: "跟随系统主题或手动切换深浅色，桌面端三栏工作台、移动端单栏加底部导航，两边都顺手",
  },
];

const faqs = [
  {
    q: "使用这个网站需要付费吗？",
    a: "网站本身完全免费、开源可自部署。你需要自备 Agnes AI 的 API Key，调用产生的费用由 Agnes 官方计费——目前文本、图像、视频三个模型均为限时免费（¥0），具体以 Agnes 官方最新定价为准，本站不加价、不代理计费。",
  },
  {
    q: "我的 API Key 会被上传或泄露吗？",
    a: "不会。Key 使用浏览器原生的 WebCrypto 加密后只保存在你自己的浏览器本地，本站没有后台服务器来存它。请求会经过一层无状态的边缘函数转发到 Agnes 官方接口，这层转发不记录、不缓存任何请求内容。",
  },
  {
    q: "生成的图片和视频保存在哪里？",
    a: "保存在你浏览器的本地数据库（IndexedDB）里，可以在「历史画廊」查看、收藏、下载，也能导出成 JSON 文件备份或换设备导入。清除浏览器数据会清空这些记录，重要作品记得及时下载或导出。",
  },
  {
    q: "支持哪些 AI 模型？",
    a: "目前接入 Agnes AI 的文本模型 Agnes 2.5 Flash、图像模型 Agnes Image 2.1 Flash、视频模型 Agnes Video 2.5 Flash。项目采用可扩展的模型适配层设计，后续可以接入更多服务商而不用改动页面逻辑。",
  },
  {
    q: "视频生成要等多久？",
    a: "视频生成是异步任务，创建后会在「任务中心」实时轮询状态（排队中 → 生成中 → 已完成），通常几十秒到几分钟不等，取决于时长与 Agnes 服务器负载。生成期间可以离开页面继续做别的创作，完成后自动存入历史画廊。",
  },
  {
    q: "手机上能正常使用吗？",
    a: "可以。界面针对手机做了单栏布局与底部导航适配，参数区可折叠、生成入口常驻底部，主流手机浏览器都能正常创作。",
  },
  {
    q: "可以部署到自己的域名吗？",
    a: "可以，项目本身就设计为可自由部署的静态站点，支持一键部署到 Cloudflare Pages、Vercel、Netlify，完整步骤教程在项目仓库的部署文档里。",
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border-subtle bg-canvas/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
          <Logo size={30} />
          <nav className="hidden items-center gap-7 md:flex">
            {navLinks.map((n) => (
              <a key={n.href} href={n.href} className="text-sm text-text-secondary transition-colors hover:text-text-primary">
                {n.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link to="/studio/text-to-image">
              <Button variant="primary" iconTrailing="arrowRight">
                开始创作
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-6 py-20 text-center lg:py-28">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-accent-violet/30 bg-accent-violet/10 px-3.5 py-1.5 text-xs text-accent-violet">
          <Icon name="sparkle" size={13} />
          AI 生图 · 生视频一体化创作工具
        </span>
        <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">让创意，一句话成真</h1>
        <p className="max-w-xl text-base leading-relaxed text-text-secondary">
          文生图 · 图生图 · 多图合成 · 视频生成，一站完成。自备 Agnes API Key 即刻开始创作，数据仅保存在本地。
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link to="/studio/text-to-image">
            <Button variant="primary" size="lg" iconTrailing="arrowRight">
              开始创作
            </Button>
          </Link>
          <a
            href="https://www.agnes-ai.cn/zh-Hans/docs/overview"
            target="_blank"
            rel="noreferrer"
            className="text-sm text-text-secondary underline decoration-border-strong underline-offset-4 hover:text-text-primary"
          >
            需要 Agnes API Key？前往获取 →
          </a>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-10 lg:py-16">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">四步开始创作</h2>
          <p className="mt-2 text-sm text-text-muted">不需要注册账号，配置好 Key 就能用</p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <div key={s.title} className="relative flex flex-col gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-gradient text-sm font-bold text-white">
                {i + 1}
              </span>
              <h3 className="text-sm font-semibold text-text-primary">{s.title}</h3>
              <p className="text-xs leading-relaxed text-text-muted">{s.desc}</p>
              {i < steps.length - 1 && (
                <Icon
                  name="arrowRight"
                  size={16}
                  className="absolute -right-3 top-2.5 hidden text-border-strong lg:block"
                />
              )}
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-10 lg:py-16">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">四种创作模式</h2>
          <p className="mt-2 text-sm text-text-muted">覆盖图片与视频创作的主要场景</p>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {capabilities.map((c) => (
            <Card key={c.title} className="flex flex-col items-center gap-3 p-6 text-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-control bg-accent-violet/10 text-accent-violet">
                <Icon name={c.icon} size={22} />
              </span>
              <h3 className="text-base font-semibold">{c.title}</h3>
              <p className="text-xs leading-relaxed text-text-muted">{c.desc}</p>
            </Card>
          ))}
        </div>

        <div className="mb-8 mt-16 text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">为什么选择这里创作</h2>
          <p className="mt-2 text-sm text-text-muted">在体验和数据掌控之间，两个都要</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {advantages.map((a) => (
            <Card key={a.title} className="flex flex-col gap-3 p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-control bg-accent-cyan/10 text-accent-cyan">
                <Icon name={a.icon} size={20} />
              </span>
              <h3 className="text-sm font-semibold text-text-primary">{a.title}</h3>
              <p className="text-xs leading-relaxed text-text-muted">{a.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-4">
        <Card className="flex items-center gap-4 p-6">
          <Icon name="lock" size={28} className="flex-shrink-0 text-text-secondary" />
          <p className="text-sm leading-relaxed text-text-secondary">
            你的 API Key 仅保存在本设备浏览器中，本站不设管理后台、不上传或留存任何数据。
            <a
              href="https://www.agnes-ai.cn/zh-Hans/docs/overview"
              target="_blank"
              rel="noreferrer"
              className="ml-1 text-accent-violet hover:underline"
            >
              前往获取 API Key →
            </a>
          </p>
        </Card>
      </section>

      <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-6 py-16">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">常见问题</h2>
        </div>
        <div>
          {faqs.map((f) => (
            <AccordionItem key={f.q} question={f.q} answer={f.a} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <Card className="flex flex-col items-center gap-5 overflow-hidden bg-accent-gradient p-10 text-center sm:p-14">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">准备好开始创作了吗？</h2>
          <p className="max-w-md text-sm text-white/85">
            自备一个 Agnes API Key，一分钟内就能生成你的第一张图片
          </p>
          <Link
            to="/studio/text-to-image"
            className="focus-ring inline-flex items-center justify-center gap-2.5 rounded-control bg-white px-6 py-3.5 text-base font-medium text-accent-violet transition-transform hover:scale-[1.02]"
          >
            立即开始创作
            <Icon name="arrowRight" size={18} />
          </Link>
        </Card>
      </section>

      <Footer />
    </div>
  );
}

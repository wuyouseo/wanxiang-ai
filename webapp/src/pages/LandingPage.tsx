import { Link } from "react-router-dom";
import { Icon } from "../components/icons/Icon";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { ThemeToggle } from "../components/ui/ThemeToggle";
import { Logo } from "../components/layout/Logo";
import { Footer } from "../components/layout/Footer";

const capabilities = [
  { icon: "image" as const, title: "文生图", desc: "输入文字描述即可生成图片，支持多种尺寸与比例" },
  { icon: "image" as const, title: "图生图", desc: "上传参考图，AI 按提示词编辑风格、背景与光影" },
  { icon: "layers" as const, title: "多图合成", desc: "组合多张图片，生成全新的融合场景" },
  { icon: "video" as const, title: "视频生成", desc: "文生视频、首尾帧控制、图片参考，三种模式" },
];

export function LandingPage() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
        <Logo size={30} />
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link to="/studio/text-to-image">
            <Button variant="primary" iconTrailing="arrowRight">
              开始创作
            </Button>
          </Link>
        </div>
      </header>

      <section className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-6 py-20 text-center lg:py-28">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-accent-violet/30 bg-accent-violet/10 px-3.5 py-1.5 text-xs text-accent-violet">
          <Icon name="sparkle" size={13} />
          AI 生图 · 生视频一体化创作工具
        </span>
        <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
          让创意，一句话成真
        </h1>
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

      <section className="mx-auto max-w-6xl px-6 py-10 lg:py-16">
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

        <Card className="mt-4 flex items-center gap-4 p-5">
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-control bg-accent-cyan/10 text-accent-cyan">
            <Icon name="sparkle" size={20} />
          </span>
          <p className="text-sm text-text-secondary">
            提示词优化：一键把你的简单描述改写为专业提示词，由文本模型 agnes-2.5-flash 驱动，可编辑后再采用
          </p>
        </Card>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16">
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

      <Footer />
    </div>
  );
}

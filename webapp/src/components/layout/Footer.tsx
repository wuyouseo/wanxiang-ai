import { Logo } from "./Logo";
import { Icon } from "../icons/Icon";

export function Footer() {
  return (
    <footer className="border-t border-border-subtle">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div className="flex flex-col gap-2">
            <Logo size={28} />
            <p className="max-w-xs text-xs leading-relaxed text-text-muted">
              文生图 · 图生图 · 多图合成 · 视频生成，一站完成。数据仅保存在你的浏览器本地。
            </p>
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-3 text-xs text-text-secondary">
            <a
              href="https://www.agnes-ai.cn/zh-Hans/docs/overview"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 hover:text-text-primary"
            >
              Agnes 官方文档
              <Icon name="arrowRight" size={11} />
            </a>
            <a
              href="https://www.agnes-ai.cn/zh-Hans/docs/agnes-25-flash"
              target="_blank"
              rel="noreferrer"
              className="hover:text-text-primary"
            >
              文本模型说明
            </a>
            <a
              href="https://www.agnes-ai.cn/zh-Hans/docs/agnes-image-21-flash"
              target="_blank"
              rel="noreferrer"
              className="hover:text-text-primary"
            >
              图像模型说明
            </a>
            <a
              href="https://www.agnes-ai.cn/zh-Hans/docs/agnes-video-25-flash"
              target="_blank"
              rel="noreferrer"
              className="hover:text-text-primary"
            >
              视频模型说明
            </a>
          </div>
        </div>
        <div className="flex flex-col-reverse items-start justify-between gap-3 border-t border-border-subtle pt-6 text-xs text-text-muted sm:flex-row sm:items-center">
          <span>© {new Date().getFullYear()} AI 创作站 · 纯前端工具，无管理后台</span>
          <div className="flex items-center gap-1.5">
            <Icon name="lock" size={13} />
            密钥与生成记录仅保存在本设备
          </div>
        </div>
      </div>
    </footer>
  );
}

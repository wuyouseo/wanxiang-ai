import { Link } from "react-router-dom";
import { Logo } from "./Logo";
import { Icon } from "../icons/Icon";
import { CONTACT_EMAIL, GITHUB_URL, PROJECT_LINKS } from "../../lib/constants";

const FEATURE_LINKS = [
  { to: "/studio/text-to-image", label: "文生图" },
  { to: "/studio/image-to-image", label: "图生图" },
  { to: "/studio/multi-image", label: "多图合成" },
  { to: "/studio/video", label: "视频生成" },
];

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">{title}</h3>
      <ul className="flex flex-col gap-2 text-xs text-text-secondary">{children}</ul>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border-subtle">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-12 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="flex flex-col gap-3">
            <Logo size={28} />
            <p className="max-w-xs text-xs leading-relaxed text-text-muted">
              文生图 · 图生图 · 多图合成 · 视频生成，一站完成。数据仅保存在你的浏览器本地。
            </p>
            <div className="flex items-center gap-1.5 text-xs text-text-muted">
              <Icon name="lock" size={13} />
              密钥与生成记录仅保存在本设备
            </div>
          </div>

          <FooterColumn title="功能导航">
            {FEATURE_LINKS.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="hover:text-text-primary">
                  {l.label}
                </Link>
              </li>
            ))}
          </FooterColumn>

          <FooterColumn title="项目链接">
            {PROJECT_LINKS.map((l) => (
              <li key={l.href}>
                <a href={l.href} target="_blank" rel="noreferrer" className="hover:text-text-primary">
                  {l.label}
                </a>
              </li>
            ))}
          </FooterColumn>

          <FooterColumn title="联系我们">
            <li>
              <a href={`mailto:${CONTACT_EMAIL}`} className="flex items-center gap-1.5 hover:text-text-primary">
                <Icon name="mail" size={13} />
                {CONTACT_EMAIL}
              </a>
            </li>
            <li>
              <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-text-primary">
                <Icon name="github" size={13} />
                GitHub
              </a>
            </li>
          </FooterColumn>
        </div>

        <div className="flex flex-col-reverse items-start justify-between gap-3 border-t border-border-subtle pt-6 text-xs text-text-muted sm:flex-row sm:items-center">
          <span>© {new Date().getFullYear()} 万象 AI · 纯前端工具，无管理后台</span>
          <span>当前生成限时免费，价格可能随官方策略调整</span>
        </div>
      </div>
    </footer>
  );
}

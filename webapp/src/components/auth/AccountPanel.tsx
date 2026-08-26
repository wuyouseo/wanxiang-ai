import { useState } from "react";
import { Button } from "../ui/Button";
import { isSupabaseConfigured } from "../../lib/supabase";
import { useAuthStore } from "../../store/useAuthStore";
import { useHistoryStore } from "../../store/useHistoryStore";

// Shared by the TopNav login modal and the Settings page "账号与云同步"
// card — both just render this with no extra plumbing.
export function AccountPanel() {
  const user = useAuthStore((s) => s.user);
  const sendingLink = useAuthStore((s) => s.sendingLink);
  const signInWithEmail = useAuthStore((s) => s.signInWithEmail);
  const signOut = useAuthStore((s) => s.signOut);
  const syncing = useHistoryStore((s) => s.syncing);
  const syncLocalToCloud = useHistoryStore((s) => s.syncLocalToCloud);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  if (!isSupabaseConfigured) {
    return <p className="text-xs text-text-muted">云同步暂未配置，生成记录仅保存在本设备。</p>;
  }

  if (user) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-accent-gradient text-sm font-semibold text-white">
            {(user.email ?? "?").slice(0, 1).toUpperCase()}
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium text-text-primary">{user.email}</span>
            <span className="text-xs text-success">已登录 · 生成记录云端同步中</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" icon="upload" loading={syncing} onClick={syncLocalToCloud}>
            同步本地历史到云端
          </Button>
          <Button size="sm" variant="secondary" onClick={signOut}>
            退出登录
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs leading-relaxed text-text-secondary">
        登录后，新生成的图片/视频会自动同步到云端，换设备、换浏览器也能看到。不登录同样可以正常使用，历史记录仅保存在本设备。
      </p>
      {sent ? (
        <p className="text-sm text-success">登录链接已发送至 {email}，请查收邮箱（含垃圾邮件夹）并点击链接完成登录。</p>
      ) : (
        <>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="focus-ring rounded-control border border-border-subtle bg-surface2 px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted"
          />
          <Button
            loading={sendingLink}
            disabled={!email.trim()}
            onClick={async () => {
              const ok = await signInWithEmail(email.trim());
              if (ok) setSent(true);
            }}
          >
            发送登录链接
          </Button>
        </>
      )}
    </div>
  );
}

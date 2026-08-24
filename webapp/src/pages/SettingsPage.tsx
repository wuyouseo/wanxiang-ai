import { useRef, useState } from "react";
import { Icon } from "../components/icons/Icon";
import { Button } from "../components/ui/Button";
import { Card, SectionLabel } from "../components/ui/Card";
import { Modal } from "../components/ui/Modal";
import { SegmentedControl } from "../components/ui/SegmentedControl";
import { Slider } from "../components/ui/Slider";
import { Switch } from "../components/ui/Switch";
import { IMAGE_RATIOS, IMAGE_SIZE_TIERS, VIDEO_MAX_SECONDS, VIDEO_MIN_SECONDS } from "../lib/constants";
import { useHistoryStore } from "../store/useHistoryStore";
import { useSettingsStore } from "../store/useSettingsStore";
import { toast } from "../store/useToastStore";

const keyStatusMeta = {
  unconfigured: { icon: "alert" as const, color: "text-text-muted", label: "尚未配置" },
  unverified: { icon: "clock" as const, color: "text-warning", label: "未验证，点击测试连接" },
  verified: { icon: "checkCircle" as const, color: "text-success", label: "已连接" },
  invalid: { icon: "alert" as const, color: "text-danger", label: "验证失败" },
};

export function SettingsPage() {
  const { settings, update, testConnection, testing, keyStatus, resetAll } = useSettingsStore();
  const { exportJSON, importJSON, clearAll } = useHistoryStore();
  const [showKey, setShowKey] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);
  const meta = keyStatusMeta[keyStatus];

  async function handleExport() {
    const json = await exportJSON();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ai-studio-history-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImportFile(file: File) {
    try {
      const text = await file.text();
      await importJSON(text);
    } catch (e) {
      toast.danger(e instanceof Error ? e.message : "导入失败，文件格式不正确");
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 md:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">设置中心</h1>
        <p className="mt-1 text-sm text-text-muted">无管理后台 —— 所有配置均保存在你的浏览器本地</p>
      </div>

      <Card className="mb-6 flex flex-col gap-5 p-6">
        <h2 className="text-base font-semibold">API Key 配置</h2>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-text-muted">Agnes API Key</label>
          <div className="flex items-center gap-2 rounded-control border border-border-subtle bg-surface2 px-3.5 py-2.5">
            <input
              type={showKey ? "text" : "password"}
              value={settings.apiKey}
              onChange={(e) => update({ apiKey: e.target.value })}
              placeholder="sk-xxxxxxxxxxxxxxxxxxxx"
              className="focus-ring flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted"
            />
            <button
              type="button"
              onClick={() => setShowKey((v) => !v)}
              aria-label={showKey ? "隐藏密钥" : "显示密钥"}
              className="focus-ring text-text-muted hover:text-text-primary"
            >
              <Icon name={showKey ? "eyeOff" : "eye"} size={17} />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-text-muted">Base URL</label>
          <input
            value={settings.baseUrl}
            onChange={(e) => update({ baseUrl: e.target.value })}
            className="focus-ring rounded-control border border-border-subtle bg-surface2 px-3.5 py-2.5 text-sm text-text-primary"
          />
        </div>

        <div className="flex items-center gap-4">
          <Button loading={testing} onClick={testConnection}>
            测试连接
          </Button>
          <div className={`flex items-center gap-1.5 text-sm ${meta.color}`}>
            <Icon name={meta.icon} size={15} />
            连接状态：{meta.label}
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-control border border-border-subtle bg-black/[0.015] dark:bg-white/[0.02] p-4">
          <Icon name="lock" size={20} className="mt-0.5 flex-shrink-0 text-text-muted" />
          <p className="text-xs leading-relaxed text-text-secondary">
            你的密钥仅加密保存在本设备浏览器中，本站不会以任何形式上传或留存。清除浏览器数据将需要重新配置。
          </p>
        </div>
      </Card>

      <Card className="mb-6 flex flex-col gap-5 p-6">
        <h2 className="text-base font-semibold">默认参数</h2>

        <div className="flex items-center gap-5">
          <span className="w-28 flex-shrink-0 text-xs text-text-muted">默认图片尺寸</span>
          <SegmentedControl options={IMAGE_SIZE_TIERS} value={settings.defaultImageSize} onChange={(v) => update({ defaultImageSize: v })} />
        </div>
        <div className="flex items-center gap-5">
          <span className="w-28 flex-shrink-0 text-xs text-text-muted">默认比例</span>
          <SegmentedControl options={IMAGE_RATIOS} value={settings.defaultImageRatio} onChange={(v) => update({ defaultImageRatio: v })} />
        </div>
        <div className="flex items-center gap-5">
          <span className="w-28 flex-shrink-0 text-xs text-text-muted">默认视频时长</span>
          <Slider
            min={VIDEO_MIN_SECONDS}
            max={VIDEO_MAX_SECONDS}
            value={Number(settings.defaultVideoSeconds)}
            onChange={(v) => update({ defaultVideoSeconds: String(v) })}
            suffix=" 秒"
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-text-muted">默认开启提示词优化</span>
          <Switch checked={settings.defaultPromptEnhance} onChange={(v) => update({ defaultPromptEnhance: v })} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-text-muted">Thinking 模式（用于提示词优化，响应更慢但更细致）</span>
          <Switch checked={settings.thinkingMode} onChange={(v) => update({ thinkingMode: v })} />
        </div>
        <div className="flex items-center gap-5">
          <span className="w-28 flex-shrink-0 text-xs text-text-muted">界面语言</span>
          <div className="flex items-center gap-2 rounded-control border border-border-subtle bg-surface2 px-3.5 py-2 text-sm text-text-secondary">
            简体中文
            <Icon name="chevronDown" size={14} />
          </div>
          <span className="text-xs text-text-muted">（预留多语言，二期）</span>
        </div>
      </Card>

      <Card className="flex flex-col gap-4 p-6">
        <h2 className="text-base font-semibold">数据管理</h2>
        <div className="flex flex-wrap gap-3">
          <Button icon="download" onClick={handleExport}>
            导出本地数据
          </Button>
          <Button icon="upload" onClick={() => importRef.current?.click()}>
            导入本地数据
          </Button>
          <input
            ref={importRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleImportFile(e.target.files[0])}
          />
          <Button variant="danger" icon="trash" onClick={() => setConfirmClear(true)}>
            清空全部数据
          </Button>
        </div>
        <SectionLabel>清空操作不可恢复，执行前需二次确认</SectionLabel>
      </Card>

      <Modal open={confirmClear} onClose={() => setConfirmClear(false)} title="确认清空全部数据？">
        <p className="mb-5 text-sm text-text-secondary">
          将永久删除本地保存的历史记录与设置（含 API Key）。此操作不可恢复。
        </p>
        <div className="flex justify-end gap-2">
          <Button onClick={() => setConfirmClear(false)}>取消</Button>
          <Button
            variant="danger"
            onClick={() => {
              clearAll();
              resetAll();
              setConfirmClear(false);
              toast.success("已清空全部本地数据");
            }}
          >
            确认清空
          </Button>
        </div>
      </Modal>
    </div>
  );
}

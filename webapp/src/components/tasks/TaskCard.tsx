import type { VideoTask } from "../../lib/types";
import { Icon, type IconName } from "../icons/Icon";
import { Badge } from "../ui/Chip";
import { Card } from "../ui/Card";

const statusMeta: Record<VideoTask["status"], { label: string; tone: "neutral" | "accent" | "success" | "danger"; icon: IconName }> = {
  queued: { label: "排队中", tone: "neutral", icon: "clock" },
  processing: { label: "生成中", tone: "accent", icon: "clock" },
  completed: { label: "已完成", tone: "success", icon: "checkCircle" },
  failed: { label: "失败", tone: "danger", icon: "alert" },
};

const modeLabel: Record<string, string> = {
  text: "文生视频",
  keyframe: "首尾帧控制",
  reference: "图片参考",
};

export function TaskCard({
  task,
  onRetry,
  onRemove,
}: {
  task: VideoTask;
  onRetry: () => void;
  onRemove: () => void;
}) {
  const meta = statusMeta[task.status];

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-24 flex-shrink-0 items-center justify-center overflow-hidden rounded-control bg-surface2">
          {task.status === "completed" && task.resultUrl ? (
            <video src={task.resultUrl} className="h-full w-full object-cover" muted />
          ) : (
            <Icon name="video" size={22} className="text-text-muted" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-text-primary">{task.params.prompt || "（无提示词）"}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <Badge tone="neutral">{modeLabel[task.params.mode]}</Badge>
            <span className="text-xs text-text-muted">
              创建于 {new Date(task.createdAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
            </span>
            {task.status === "processing" && typeof task.progress === "number" && (
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-32 overflow-hidden rounded-full bg-surface2">
                  <div className="h-full bg-accent-gradient" style={{ width: `${task.progress}%` }} />
                </div>
                <span className="text-xs text-text-secondary">{task.progress}%</span>
              </div>
            )}
          </div>
        </div>

        <Badge tone={meta.tone}>
          <Icon name={meta.icon} size={13} />
          {meta.label}
        </Badge>

        <div className="flex flex-shrink-0 items-center gap-3 text-text-secondary">
          {task.status === "completed" && task.resultUrl && (
            <a href={task.resultUrl} download aria-label="下载" className="focus-ring hover:text-text-primary">
              <Icon name="download" size={16} />
            </a>
          )}
          {task.status === "failed" && (
            <button onClick={onRetry} aria-label="重试" className="focus-ring hover:text-text-primary">
              <Icon name="retry" size={16} />
            </button>
          )}
          <button onClick={onRemove} aria-label="删除" className="focus-ring hover:text-danger">
            <Icon name="trash" size={16} />
          </button>
        </div>
      </div>

      {task.status === "failed" && task.errorMessage && (
        <div className="rounded-control border border-danger/30 bg-danger/5 px-3 py-2 text-xs text-danger">
          错误详情：{task.errorMessage}
        </div>
      )}
    </Card>
  );
}

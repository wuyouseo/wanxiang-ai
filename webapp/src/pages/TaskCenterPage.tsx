import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { TaskCard } from "../components/tasks/TaskCard";
import { Chip } from "../components/ui/Chip";
import { Button } from "../components/ui/Button";
import { Icon } from "../components/icons/Icon";
import { useSettingsStore } from "../store/useSettingsStore";
import { useTaskStore } from "../store/useTaskStore";
import type { TaskStatus } from "../lib/types";

const filters: { key: TaskStatus | "all"; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "queued", label: "排队中" },
  { key: "processing", label: "生成中" },
  { key: "completed", label: "已完成" },
  { key: "failed", label: "失败" },
];

export function TaskCenterPage() {
  const settings = useSettingsStore((s) => s.settings);
  const tasks = useTaskStore((s) => s.tasks);
  const hydrated = useTaskStore((s) => s.hydrated);
  const hydrate = useTaskStore((s) => s.hydrate);
  const retryTask = useTaskStore((s) => s.retryTask);
  const removeTask = useTaskStore((s) => s.removeTask);
  const [filter, setFilter] = useState<TaskStatus | "all">("all");

  useEffect(() => {
    if (!hydrated) hydrate(settings);
  }, [hydrated, hydrate, settings]);

  const visible = filter === "all" ? tasks : tasks.filter((t) => t.status === filter);

  return (
    <div className="mx-auto max-w-4xl px-5 py-8 md:px-8">
      <div className="mb-1 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">任务中心</h1>
          <p className="mt-1 text-sm text-text-muted">视频异步生成任务列表，创建后自动轮询状态，刷新页面不会丢失</p>
        </div>
        <Link to="/studio/video">
          <Button variant="primary" icon="plus" size="sm">
            新建视频任务
          </Button>
        </Link>
      </div>

      <div className="my-5 flex flex-wrap gap-2">
        {filters.map((f) => (
          <Chip key={f.key} active={filter === f.key} onClick={() => setFilter(f.key)}>
            {f.label}
            {f.key !== "all" && (
              <span className="ml-1 text-text-muted">{tasks.filter((t) => t.status === f.key).length}</span>
            )}
          </Chip>
        ))}
      </div>

      {tasks.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-border-strong py-20 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-violet/10 text-accent-violet">
            <Icon name="video" size={22} />
          </span>
          <p className="text-sm text-text-secondary">还没有视频任务</p>
          <p className="max-w-xs text-xs text-text-muted">
            视频生成是异步任务：创建后会在这里实时跟踪排队、生成中、完成或失败的状态，即使中途刷新页面也不会丢失
          </p>
          <Link to="/studio/video" className="mt-2">
            <Button variant="primary" icon="video">
              前往创建视频
            </Button>
          </Link>
        </div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-card border border-dashed border-border-strong py-16 text-center text-text-muted">
          <p className="text-sm">没有符合当前筛选条件的任务</p>
          <button onClick={() => setFilter("all")} className="focus-ring text-xs text-accent-violet hover:underline">
            清除筛选，查看全部
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {visible.map((t) => (
            <TaskCard key={t.id} task={t} onRetry={() => retryTask(t.id, settings)} onRemove={() => removeTask(t.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

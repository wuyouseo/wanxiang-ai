import { create } from "zustand";
import {
  VIDEO_POLL_INTERVAL_HIDDEN_MS,
  VIDEO_POLL_INTERVAL_MS,
} from "../lib/constants";
import { getActiveProvider } from "../lib/providers";
import { deleteTask, getAllTasks, patchTask as patchTaskDB, renameTaskId, saveTask } from "../lib/storage/taskDB";
import type { AppSettings, VideoGenerationParams, VideoTask } from "../lib/types";
import { ProviderError } from "../lib/types";
import { useHistoryStore } from "./useHistoryStore";
import { toast } from "./useToastStore";

// A background polling manager, deliberately NOT tied to any component's
// lifecycle: video tasks must keep tracking status while the user navigates
// away to keep creating in the workbench (see docs/网页设计文档.md §6.4).
// Tasks are also persisted to IndexedDB (storage/taskDB.ts) — otherwise a
// page reload (or the browser being closed mid-generation) would silently
// wipe the task center, which is exactly the bug this fixes: in-flight and
// completed tasks used to live in memory only.

const pollTimers = new Map<string, ReturnType<typeof setTimeout>>();

function pollIntervalMs(): number {
  return document.visibilityState === "hidden"
    ? VIDEO_POLL_INTERVAL_HIDDEN_MS
    : VIDEO_POLL_INTERVAL_MS;
}

interface TaskState {
  tasks: VideoTask[];
  hydrated: boolean;
  hydrate: (settings: AppSettings) => Promise<void>;
  createTask: (params: VideoGenerationParams, settings: AppSettings) => Promise<void>;
  retryTask: (taskId: string, settings: AppSettings) => Promise<void>;
  removeTask: (taskId: string) => void;
  pendingCount: () => number;
}

export const useTaskStore = create<TaskState>((set, get) => {
  function patchLocal(id: string, patch: Partial<VideoTask>) {
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch, updatedAt: Date.now() } : t)),
    }));
  }

  function schedulePoll(taskId: string, settings: AppSettings, params: VideoGenerationParams) {
    const timer = setTimeout(() => runPoll(taskId, settings, params), pollIntervalMs());
    pollTimers.set(taskId, timer);
  }

  async function runPoll(taskId: string, settings: AppSettings, params: VideoGenerationParams) {
    const provider = getActiveProvider();
    try {
      const result = await provider.video.queryVideoTask(taskId, params, settings);
      const patch = {
        status: result.status,
        progress: result.progress,
        resultUrl: result.resultUrl,
        errorMessage: result.errorMessage,
      };
      patchLocal(taskId, patch);
      await patchTaskDB(taskId, patch).catch(() => {});

      if (result.status === "completed" && result.resultUrl) {
        pollTimers.delete(taskId);
        const task = get().tasks.find((t) => t.id === taskId);
        if (task) {
          await useHistoryStore.getState().add({
            id: crypto.randomUUID(),
            type: "video",
            createdAt: Date.now(),
            favorite: false,
            resultUrl: result.resultUrl,
            resultKind: "video",
            params: task.params,
            prompt: task.params.prompt,
          });
        }
        toast.success("视频生成完成，已加入历史画廊");
        return;
      }
      if (result.status === "failed") {
        pollTimers.delete(taskId);
        toast.danger(`视频生成失败：${result.errorMessage ?? "未知错误"}`);
        return;
      }
      schedulePoll(taskId, settings, params);
    } catch {
      // Transient network hiccup — keep polling rather than failing the
      // whole task on one bad request.
      schedulePoll(taskId, settings, params);
    }
  }

  return {
    tasks: [],
    hydrated: false,

    hydrate: async (settings) => {
      if (get().hydrated) return;
      const tasks = await getAllTasks().catch(() => [] as VideoTask[]);
      set({ tasks, hydrated: true });
      if (!settings.apiKey) return;
      // Resume tracking anything that was still in flight when the page
      // last unloaded — its in-memory poll timer is gone, but the task
      // itself (and its params) survived in IndexedDB.
      for (const task of tasks) {
        if (task.status === "queued" || task.status === "processing") {
          runPoll(task.id, settings, task.params);
        }
      }
    },

    createTask: async (params, settings) => {
      const provider = getActiveProvider();
      const localId = crypto.randomUUID();
      const optimisticTask: VideoTask = {
        id: localId,
        providerId: "pending",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        status: "queued",
        params,
      };
      set((s) => ({ tasks: [optimisticTask, ...s.tasks] }));
      await saveTask(optimisticTask).catch(() => {});

      try {
        const { taskId } = await provider.video.createVideoTask(params, settings);
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === localId ? { ...t, id: taskId, providerId: taskId } : t)),
        }));
        await renameTaskId(localId, taskId, { providerId: taskId }).catch(() => {});
        schedulePoll(taskId, settings, params);
        toast.info("视频任务已创建，正在生成中");
      } catch (e) {
        const message = e instanceof ProviderError ? e.message : "创建视频任务失败";
        patchLocal(localId, { status: "failed", errorMessage: message });
        await patchTaskDB(localId, { status: "failed", errorMessage: message }).catch(() => {});
        toast.danger(message);
      }
    },

    retryTask: async (taskId, settings) => {
      const task = get().tasks.find((t) => t.id === taskId);
      if (!task) return;
      get().removeTask(taskId);
      await get().createTask(task.params, settings);
    },

    removeTask: (taskId) => {
      const timer = pollTimers.get(taskId);
      if (timer) {
        clearTimeout(timer);
        pollTimers.delete(taskId);
      }
      set((s) => ({ tasks: s.tasks.filter((t) => t.id !== taskId) }));
      deleteTask(taskId).catch(() => {});
    },

    pendingCount: () =>
      get().tasks.filter((t) => t.status === "queued" || t.status === "processing").length,
  };
});

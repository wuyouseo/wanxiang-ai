import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PromptInput } from "../../components/workbench/PromptInput";
import { UploadZone } from "../../components/workbench/UploadZone";
import { MultiImageUploader } from "../../components/workbench/MultiImageUploader";
import { TaskCard } from "../../components/tasks/TaskCard";
import { Button } from "../../components/ui/Button";
import { Card, SectionLabel } from "../../components/ui/Card";
import { SegmentedControl } from "../../components/ui/SegmentedControl";
import { RatioPicker } from "../../components/ui/RatioPicker";
import { Slider } from "../../components/ui/Slider";
import { Icon } from "../../components/icons/Icon";
import {
  VIDEO_DIMENSIONS,
  VIDEO_MAX_REFERENCE_IMAGES,
  VIDEO_MAX_SECONDS,
  VIDEO_MIN_SECONDS,
  VIDEO_MODEL_LABELS,
  VIDEO_MODEL_OPTIONS,
  VIDEO_RATIOS,
} from "../../lib/constants";
import type { VideoGenerationParams, VideoMode, VideoModelId, VideoRatio } from "../../lib/types";
import { useSettingsStore } from "../../store/useSettingsStore";
import { useTaskStore } from "../../store/useTaskStore";
import { useTransferStore } from "../../store/useTransferStore";
import { toast } from "../../store/useToastStore";

const modeLabels: Record<VideoMode, string> = {
  text: "文生视频",
  keyframe: "首尾帧控制",
  reference: "图片参考",
};

export function VideoGenerationPanel() {
  const settings = useSettingsStore((s) => s.settings);
  const [mode, setMode] = useState<VideoMode>("text");
  const [model, setModel] = useState<VideoModelId>(VIDEO_MODEL_OPTIONS[0]);
  const [prompt, setPrompt] = useState("");
  const [seconds, setSeconds] = useState(Number(settings.defaultVideoSeconds) || 5);
  const [ratio, setRatio] = useState<VideoRatio>("16:9");
  const [firstFrame, setFirstFrame] = useState<string | null>(null);
  const [lastFrame, setLastFrame] = useState<string | null>(null);
  const [referenceImages, setReferenceImages] = useState<string[]>([]);

  const createTask = useTaskStore((s) => s.createTask);
  const retryTask = useTaskStore((s) => s.retryTask);
  const removeTask = useTaskStore((s) => s.removeTask);
  const tasks = useTaskStore((s) => s.tasks);
  const activeTasks = tasks.filter((t) => t.status === "queued" || t.status === "processing").slice(0, 2);

  const pendingImage = useTransferStore((s) => s.pendingImage);
  const setPendingImage = useTransferStore((s) => s.setPendingImage);
  useEffect(() => {
    if (pendingImage) {
      if (mode === "reference" && referenceImages.length < VIDEO_MAX_REFERENCE_IMAGES) {
        setReferenceImages((prev) => [...prev, pendingImage]);
      } else if (mode === "keyframe" && !firstFrame) {
        setFirstFrame(pendingImage);
      }
      setPendingImage(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingImage]);

  const pendingReuse = useTransferStore((s) => s.pendingReuse);
  const setPendingReuse = useTransferStore((s) => s.setPendingReuse);
  useEffect(() => {
    if (pendingReuse?.type === "video") {
      const p = pendingReuse.params as VideoGenerationParams;
      setPrompt(p.prompt);
      setMode(p.mode);
      if (p.model) setModel(p.model);
      setSeconds(Number(p.seconds));
      setRatio(p.ratio);
      setFirstFrame(p.firstFrame ?? null);
      setLastFrame(p.lastFrame ?? null);
      setReferenceImages(p.referenceImages ?? []);
      setPendingReuse(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingReuse]);

  const [w, h] = VIDEO_DIMENSIONS[ratio];

  function handleGenerate() {
    if (!prompt.trim()) {
      toast.warning("请先输入提示词");
      return;
    }
    if (mode === "keyframe" && (!firstFrame || !lastFrame)) {
      toast.warning("首尾帧控制模式需要同时上传首帧和尾帧");
      return;
    }
    if (mode === "reference" && referenceImages.length === 0) {
      toast.warning("图片参考模式至少需要上传 1 张参考图");
      return;
    }
    const params: VideoGenerationParams = {
      prompt,
      mode,
      seconds: String(seconds),
      ratio,
      model,
      ...(mode === "keyframe" ? { firstFrame: firstFrame!, lastFrame: lastFrame! } : {}),
      ...(mode === "reference" ? { referenceImages } : {}),
    };
    createTask(params, settings);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">视频生成 · Video Generation</h1>
        <p className="mt-1 text-sm text-text-muted">文生视频 · 首尾帧控制 · 图片参考，三种模式</p>
      </div>

      <SegmentedControl options={["text", "keyframe", "reference"] as VideoMode[]} value={mode} onChange={setMode} labels={modeLabels} />

      {mode === "keyframe" && (
        <Card className="flex items-center gap-4 p-5">
          <UploadZone value={firstFrame} onChange={setFirstFrame} label="首帧上传" className="h-32 w-40 flex-shrink-0" />
          <Icon name="arrowRight" size={22} className="flex-shrink-0 text-text-muted" />
          <UploadZone value={lastFrame} onChange={setLastFrame} label="尾帧上传" className="h-32 w-40 flex-shrink-0" />
          <p className="text-xs text-text-muted">提示词描述如何从首帧过渡到尾帧</p>
        </Card>
      )}

      {mode === "reference" && (
        <Card className="p-5">
          <MultiImageUploader images={referenceImages} onChange={setReferenceImages} maxImages={VIDEO_MAX_REFERENCE_IMAGES} />
        </Card>
      )}

      <PromptInput
        value={prompt}
        onChange={setPrompt}
        placeholder="描述视频内容，例如：雨后的未来城市街道，霓虹灯倒映在地面，一辆银色跑车缓慢驶过，电影级运镜"
      />

      <Card className="flex flex-col gap-5 p-5">
        <div className="flex items-start gap-5">
          <span className="w-20 flex-shrink-0 pt-2 text-xs text-text-muted">模型</span>
          <div className="flex flex-col gap-2">
            <SegmentedControl
              options={VIDEO_MODEL_OPTIONS}
              value={model}
              onChange={setModel}
              labels={VIDEO_MODEL_LABELS}
            />
            <p className="text-xs text-text-muted">不同代次的模型在画质与提示词遵循上略有差异</p>
          </div>
        </div>
        <div className="flex items-center gap-5">
          <span className="w-20 flex-shrink-0 text-xs text-text-muted">时长</span>
          <Slider min={VIDEO_MIN_SECONDS} max={VIDEO_MAX_SECONDS} value={seconds} onChange={setSeconds} suffix=" 秒" />
        </div>
        <div className="flex items-start gap-5">
          <span className="w-20 flex-shrink-0 pt-2 text-xs text-text-muted">画幅比例</span>
          <div className="flex flex-col gap-2">
            <RatioPicker options={VIDEO_RATIOS} value={ratio} onChange={setRatio} />
            <p className="text-xs text-text-muted">
              预计输出 {w} × {h} px（分辨率固定 720P）
            </p>
          </div>
        </div>
      </Card>

      <Button variant="primary" size="lg" onClick={handleGenerate}>
        生成视频
      </Button>

      {activeTasks.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <SectionLabel>进行中的任务</SectionLabel>
            <Link to="/tasks" className="text-xs text-accent-violet hover:underline">
              查看全部任务 →
            </Link>
          </div>
          {activeTasks.map((t) => (
            <TaskCard key={t.id} task={t} onRetry={() => retryTask(t.id, settings)} onRemove={() => removeTask(t.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

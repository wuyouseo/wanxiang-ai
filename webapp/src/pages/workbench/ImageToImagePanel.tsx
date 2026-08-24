import { useEffect, useState } from "react";
import { PromptInput } from "../../components/workbench/PromptInput";
import { ImageParamPanel } from "../../components/workbench/ImageParamPanel";
import { ResultPreview } from "../../components/workbench/ResultPreview";
import { UploadZone } from "../../components/workbench/UploadZone";
import { Button } from "../../components/ui/Button";
import { SectionLabel } from "../../components/ui/Card";
import { useImageGenerator } from "../../hooks/useImageGenerator";
import { useSettingsStore } from "../../store/useSettingsStore";
import { useHistoryStore } from "../../store/useHistoryStore";
import { useTransferStore } from "../../store/useTransferStore";
import type { ImageGenerationParams, ImageRatio, ImageSizeTier } from "../../lib/types";
import { toast } from "../../store/useToastStore";

const QUICK_TAGS = ["更换背景", "改变风格", "调整光线", "添加元素", "移除元素"];

export function ImageToImagePanel() {
  const settings = useSettingsStore((s) => s.settings);
  const [prompt, setPrompt] = useState("");
  const [inputImage, setInputImage] = useState<string | null>(null);
  const [size, setSize] = useState<ImageSizeTier>(settings.defaultImageSize);
  const [ratio, setRatio] = useState<ImageRatio>(settings.defaultImageRatio);
  const { generate, loading, result } = useImageGenerator("image-to-image");
  const toggleFavorite = useHistoryStore((s) => s.toggleFavorite);
  const items = useHistoryStore((s) => s.items);

  const pendingImage = useTransferStore((s) => s.pendingImage);
  const setPendingImage = useTransferStore((s) => s.setPendingImage);
  useEffect(() => {
    if (pendingImage) {
      setInputImage(pendingImage);
      setPendingImage(null);
    }
  }, [pendingImage, setPendingImage]);

  const pendingReuse = useTransferStore((s) => s.pendingReuse);
  const setPendingReuse = useTransferStore((s) => s.setPendingReuse);
  useEffect(() => {
    if (pendingReuse?.type === "image-to-image") {
      const p = pendingReuse.params as ImageGenerationParams;
      setPrompt(p.prompt);
      setSize(p.size);
      setRatio(p.ratio);
      setInputImage(p.inputImages[0] ?? null);
      setPendingReuse(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingReuse]);

  const matchedHistory = items.find((i) => i.resultUrl === result);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">图生图 · Image to Image</h1>
        <p className="mt-1 text-sm text-text-muted">上传参考图，用文字描述改变它</p>
      </div>

      <div>
        <SectionLabel className="mb-2">参考图</SectionLabel>
        <UploadZone
          value={inputImage}
          onChange={setInputImage}
          label="拖拽 / 点击 / 粘贴上传参考图"
          hint="支持从右侧历史结果一键设为输入图"
          className="h-40"
        />
      </div>

      <PromptInput
        value={prompt}
        onChange={setPrompt}
        quickTags={QUICK_TAGS}
        placeholder="描述要如何改变这张图，例如：把场景改成雨夜的赛博朋克风格，保留原有构图"
      />

      <ImageParamPanel size={size} ratio={ratio} onSizeChange={setSize} onRatioChange={setRatio} />

      <Button
        variant="primary"
        size="lg"
        loading={loading}
        onClick={() => {
          if (!inputImage) {
            toast.warning("请先上传参考图");
            return;
          }
          generate({ prompt, size, ratio, inputImages: [inputImage] });
        }}
      >
        生成图片
      </Button>

      <ResultPreview
        kind="image"
        src={result}
        loading={loading}
        actions={[
          { icon: "download", label: "下载", onClick: () => result && window.open(result, "_blank") },
          {
            icon: matchedHistory?.favorite ? "starFilled" : "star",
            label: "收藏",
            active: matchedHistory?.favorite,
            onClick: () => matchedHistory && toggleFavorite(matchedHistory.id),
          },
          {
            icon: "image",
            label: "继续编辑",
            onClick: () => result && setInputImage(result),
          },
        ]}
      />
    </div>
  );
}

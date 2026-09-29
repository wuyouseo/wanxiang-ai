import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PromptInput } from "../../components/workbench/PromptInput";
import { ImageParamPanel } from "../../components/workbench/ImageParamPanel";
import { ResultPreview } from "../../components/workbench/ResultPreview";
import { Button } from "../../components/ui/Button";
import { useImageGenerator } from "../../hooks/useImageGenerator";
import { useSettingsStore } from "../../store/useSettingsStore";
import { useHistoryStore } from "../../store/useHistoryStore";
import { useTransferStore } from "../../store/useTransferStore";
import type { ImageGenerationParams, ImageRatio, ImageSizeTier } from "../../lib/types";
import { toast } from "../../store/useToastStore";

export function TextToImagePanel() {
  const settings = useSettingsStore((s) => s.settings);
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");
  const [size, setSize] = useState<ImageSizeTier>(settings.defaultImageSize);
  const [ratio, setRatio] = useState<ImageRatio>(settings.defaultImageRatio);
  const { generate, loading, result } = useImageGenerator("text-to-image");
  const toggleFavorite = useHistoryStore((s) => s.toggleFavorite);
  const items = useHistoryStore((s) => s.items);
  const setPendingImage = useTransferStore((s) => s.setPendingImage);

  const pendingReuse = useTransferStore((s) => s.pendingReuse);
  const setPendingReuse = useTransferStore((s) => s.setPendingReuse);
  useEffect(() => {
    if (pendingReuse?.type === "text-to-image") {
      const p = pendingReuse.params as ImageGenerationParams;
      setPrompt(p.prompt);
      setSize(p.size);
      setRatio(p.ratio);
      setPendingReuse(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingReuse]);

  const matchedHistory = items.find((i) => i.resultUrl === result);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">文生图 · Text to Image</h1>
        <p className="mt-1 text-sm text-text-muted">输入文字描述，生成图片</p>
      </div>

      <PromptInput value={prompt} onChange={setPrompt} placeholder="例如：一只橘猫坐在雨后的窗台上，柔和的晨光，电影感" />

      <ImageParamPanel size={size} ratio={ratio} onSizeChange={setSize} onRatioChange={setRatio} />

      <Button
        variant="primary"
        size="lg"
        loading={loading}
        onClick={() => generate({ prompt, size, ratio, inputImages: [] })}
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
            icon: "copy",
            label: "复制提示词",
            onClick: () => {
              navigator.clipboard.writeText(prompt);
              toast.success("提示词已复制");
            },
          },
          {
            icon: "image",
            label: "以此图继续图生图",
            onClick: () => {
              if (!result) return;
              setPendingImage(result);
              navigate("/studio/image-to-image");
            },
          },
        ]}
      />
    </div>
  );
}

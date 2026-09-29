import { useEffect, useState } from "react";
import { PromptInput } from "../../components/workbench/PromptInput";
import { ImageParamPanel } from "../../components/workbench/ImageParamPanel";
import { ResultPreview } from "../../components/workbench/ResultPreview";
import { MultiImageUploader } from "../../components/workbench/MultiImageUploader";
import { Button } from "../../components/ui/Button";
import { useImageGenerator } from "../../hooks/useImageGenerator";
import { useSettingsStore } from "../../store/useSettingsStore";
import { useHistoryStore } from "../../store/useHistoryStore";
import { useTransferStore } from "../../store/useTransferStore";
import { MULTI_IMAGE_FREE_LIMIT } from "../../lib/constants";
import type { ImageGenerationParams, ImageRatio, ImageSizeTier } from "../../lib/types";
import { toast } from "../../store/useToastStore";

const QUICK_TAGS = ["角色融合", "场景合成", "风格迁移拼贴"];

export function MultiImagePanel() {
  const settings = useSettingsStore((s) => s.settings);
  const [prompt, setPrompt] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [size, setSize] = useState<ImageSizeTier>(settings.defaultImageSize);
  const [ratio, setRatio] = useState<ImageRatio>(settings.defaultImageRatio);
  const { generate, loading, result } = useImageGenerator("multi-image");
  const toggleFavorite = useHistoryStore((s) => s.toggleFavorite);
  const items = useHistoryStore((s) => s.items);

  const pendingImage = useTransferStore((s) => s.pendingImage);
  const setPendingImage = useTransferStore((s) => s.setPendingImage);
  useEffect(() => {
    if (pendingImage) {
      setImages((prev) => (prev.length < 8 ? [...prev, pendingImage] : prev));
      setPendingImage(null);
    }
  }, [pendingImage, setPendingImage]);

  const pendingReuse = useTransferStore((s) => s.pendingReuse);
  const setPendingReuse = useTransferStore((s) => s.setPendingReuse);
  useEffect(() => {
    if (pendingReuse?.type === "multi-image") {
      const p = pendingReuse.params as ImageGenerationParams;
      setPrompt(p.prompt);
      setSize(p.size);
      setRatio(p.ratio);
      setImages(p.inputImages);
      setPendingReuse(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingReuse]);

  const matchedHistory = items.find((i) => i.resultUrl === result);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">多图合成 · Multi-image Composition</h1>
        <p className="mt-1 text-sm text-text-muted">上传多张图片，用文字描述如何组合它们</p>
      </div>

      <MultiImageUploader
        images={images}
        onChange={setImages}
        maxImages={8}
        warnAfter={MULTI_IMAGE_FREE_LIMIT}
        warnMessage="第 4 张起可能产生额外费用"
      />

      <PromptInput
        value={prompt}
        onChange={setPrompt}
        quickTags={QUICK_TAGS}
        placeholder="描述如何组合这些图片，例如：将 <Picture 1> 和 <Picture 2> 的角色合成一场激烈的奇幻战斗场景"
      />

      <ImageParamPanel size={size} ratio={ratio} onSizeChange={setSize} onRatioChange={setRatio} />

      <Button
        variant="primary"
        size="lg"
        loading={loading}
        onClick={() => {
          if (images.length < 2) {
            toast.warning("多图合成至少需要上传 2 张图片");
            return;
          }
          generate({ prompt, size, ratio, inputImages: images });
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
        ]}
      />
    </div>
  );
}

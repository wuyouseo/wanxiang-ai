import { useState } from "react";
import { getActiveProvider } from "../lib/providers";
import type { FeatureType, ImageGenerationParams } from "../lib/types";
import { ProviderError } from "../lib/types";
import { useHistoryStore } from "../store/useHistoryStore";
import { useSettingsStore } from "../store/useSettingsStore";
import { toast } from "../store/useToastStore";

export function useImageGenerator(type: FeatureType) {
  const settings = useSettingsStore((s) => s.settings);
  const addHistory = useHistoryStore((s) => s.add);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function generate(params: ImageGenerationParams) {
    if (!params.prompt.trim()) {
      toast.warning("请先输入提示词");
      return;
    }
    if (!settings.apiKey) {
      toast.warning("请先在设置中心配置 API Key");
      return;
    }
    setLoading(true);
    try {
      const provider = getActiveProvider();
      const [first] = await provider.image.generateImage(params, settings);
      const url = first?.url ?? (first?.b64Json ? `data:image/png;base64,${first.b64Json}` : undefined);
      if (!url) throw new ProviderError("生成成功但未返回图片", "server");
      setResult(url);
      await addHistory({
        id: crypto.randomUUID(),
        type,
        createdAt: Date.now(),
        favorite: false,
        resultUrl: url,
        resultKind: "image",
        params,
        prompt: params.prompt,
      });
      toast.success("生成完成");
    } catch (e) {
      toast.danger(e instanceof ProviderError ? e.message : "生成失败，请重试");
    } finally {
      setLoading(false);
    }
  }

  return { generate, loading, result, setResult };
}

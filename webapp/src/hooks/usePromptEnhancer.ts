import { useRef, useState } from "react";
import { PROMPT_ENHANCER_SYSTEM_PROMPT } from "../lib/constants";
import { getActiveProvider } from "../lib/providers";
import { ProviderError } from "../lib/types";
import { useSettingsStore } from "../store/useSettingsStore";
import { toast } from "../store/useToastStore";

export function usePromptEnhancer() {
  const settings = useSettingsStore((s) => s.settings);
  const [streaming, setStreaming] = useState(false);
  const [result, setResult] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  async function enhance(prompt: string) {
    if (!prompt.trim()) {
      toast.warning("请先输入提示词");
      return;
    }
    if (!settings.apiKey) {
      toast.warning("请先在设置中心配置 API Key");
      return;
    }
    setResult("");
    setStreaming(true);
    const controller = new AbortController();
    abortRef.current = controller;
    const provider = getActiveProvider();

    try {
      const stream = provider.text.streamChat(
        {
          systemPrompt: PROMPT_ENHANCER_SYSTEM_PROMPT,
          userPrompt: prompt,
          enableThinking: settings.thinkingMode,
          model: settings.defaultTextModel,
          signal: controller.signal,
        },
        settings,
      );
      for await (const delta of stream) {
        setResult((prev) => prev + delta);
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        // user-initiated stop — not an error
      } else {
        toast.danger(e instanceof ProviderError ? e.message : "提示词优化失败，请重试");
      }
    } finally {
      setStreaming(false);
    }
  }

  function stop() {
    abortRef.current?.abort();
    setStreaming(false);
  }

  function reset() {
    setResult("");
  }

  return { enhance, stop, reset, streaming, result, setResult };
}

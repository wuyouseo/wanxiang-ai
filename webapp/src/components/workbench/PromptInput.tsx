import { usePromptEnhancer } from "../../hooks/usePromptEnhancer";
import { Button } from "../ui/Button";
import { Chip } from "../ui/Chip";
import { Card } from "../ui/Card";

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  quickTags?: string[];
  rows?: number;
}

export function PromptInput({ value, onChange, placeholder, quickTags, rows = 4 }: Props) {
  const { enhance, stop, reset, streaming, result } = usePromptEnhancer();

  const hasComparison = streaming || result.length > 0;

  function insertTag(tag: string) {
    onChange(value ? `${value}，${tag}` : tag);
  }

  function accept() {
    onChange(result);
    reset();
  }

  return (
    <Card className="flex flex-col gap-3 p-4">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "描述你想生成的画面，越具体效果越好…"}
        rows={rows}
        className="focus-ring w-full resize-none rounded-control bg-transparent text-[15px] leading-relaxed text-text-primary placeholder:text-text-muted"
      />

      {quickTags && quickTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {quickTags.map((tag) => (
            <Chip key={tag} onClick={() => insertTag(tag)}>
              {tag}
            </Chip>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-xs text-text-muted">{value.length} 字符</span>
        {streaming ? (
          <Button variant="secondary" size="sm" onClick={stop}>
            停止生成
          </Button>
        ) : (
          <Button variant="secondary" size="sm" icon="sparkle" onClick={() => enhance(value)}>
            优化提示词
          </Button>
        )}
      </div>

      {hasComparison && (
        <div className="grid grid-cols-1 gap-3 rounded-control border border-dashed border-border-strong bg-black/[0.015] dark:bg-white/[0.02] p-3 sm:grid-cols-2">
          <div>
            <div className="mb-1.5 text-xs text-text-muted">原文</div>
            <p className="text-sm text-text-secondary">{value || "（空）"}</p>
          </div>
          <div>
            <div className="mb-1.5 text-xs text-text-muted">AI 改写结果{streaming && "（生成中…）"}</div>
            <p className="whitespace-pre-wrap text-sm text-text-primary">
              {result}
              {streaming && <span className="ml-0.5 inline-block h-4 w-[2px] animate-pulse bg-accent-violet align-middle" />}
            </p>
          </div>
          {!streaming && result && (
            <div className="col-span-full flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={reset}>
                放弃
              </Button>
              <Button variant="primary" size="sm" onClick={accept}>
                采用
              </Button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

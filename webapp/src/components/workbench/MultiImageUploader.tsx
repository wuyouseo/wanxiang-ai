import { useRef, useState } from "react";
import { Icon } from "../icons/Icon";
import { normalizeImageFile } from "../../lib/fileUtils";
import { toast } from "../../store/useToastStore";
import { Badge } from "../ui/Chip";

interface Props {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages: number;
  warnAfter?: number;
  warnMessage?: string;
}

export function MultiImageUploader({ images, onChange, maxImages, warnAfter, warnMessage }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dragIndex = useRef<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  async function handleFiles(files: FileList | File[]) {
    const room = maxImages - images.length;
    if (room <= 0) {
      toast.warning(`最多只能上传 ${maxImages} 张图片`);
      return;
    }
    const picked = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, room);
    try {
      const dataUris = await Promise.all(picked.map(normalizeImageFile));
      onChange([...images, ...dataUris]);
    } catch (e) {
      toast.danger(e instanceof Error ? e.message : "图片处理失败");
    }
  }

  function removeAt(index: number) {
    onChange(images.filter((_, i) => i !== index));
  }

  function moveTo(from: number, to: number) {
    if (from === to) return;
    const next = [...images];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  }

  const showWarning = warnAfter !== undefined && images.length >= warnAfter;

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-muted">参考图（可拖拽调整顺序，序号对应提示词引用）</span>
        {showWarning && warnMessage && <Badge tone="warning">{warnMessage}</Badge>}
      </div>

      <div className="flex flex-wrap gap-3">
        {images.map((src, i) => (
          <div
            key={i}
            draggable
            onDragStart={() => (dragIndex.current = i)}
            onDragOver={(e) => {
              e.preventDefault();
              setOverIndex(i);
            }}
            onDragLeave={() => setOverIndex(null)}
            onDrop={(e) => {
              e.preventDefault();
              if (dragIndex.current !== null) moveTo(dragIndex.current, i);
              dragIndex.current = null;
              setOverIndex(null);
            }}
            className={`group relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-control border transition-colors ${
              overIndex === i ? "border-accent-violet" : "border-border-subtle"
            }`}
          >
            <img src={src} alt={`参考图 ${i + 1}`} className="h-full w-full cursor-grab object-cover" />
            <span className="absolute left-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-[11px] font-semibold text-white">
              {i + 1}
            </span>
            <button
              type="button"
              onClick={() => removeAt(i)}
              aria-label="移除"
              className="focus-ring absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-white opacity-0 transition-opacity group-hover:opacity-100"
            >
              <Icon name="close" size={11} />
            </button>
            <span className="absolute bottom-1 right-1 text-text-muted opacity-0 transition-opacity group-hover:opacity-100">
              <Icon name="dots" size={13} className="text-white/80" />
            </span>
          </div>
        ))}

        {images.length < maxImages && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="focus-ring flex h-24 w-24 flex-shrink-0 flex-col items-center justify-center gap-1 rounded-control border-2 border-dashed border-border-strong text-text-muted transition-colors hover:border-text-muted"
          >
            <Icon name="plus" size={18} />
            <span className="text-[11px]">
              添加（{images.length}/{maxImages}）
            </span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />
      <p className="text-[11px] text-text-muted">
        在提示词中使用 <code className="rounded bg-black/[0.05] dark:bg-white/10 px-1 py-0.5">&lt;Picture 1&gt;</code>、
        <code className="rounded bg-black/[0.05] dark:bg-white/10 px-1 py-0.5">&lt;Picture 2&gt;</code> 引用对应序号的图片
      </p>
    </div>
  );
}

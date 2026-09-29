import { useRef, useState, type DragEvent } from "react";
import { Icon } from "../icons/Icon";
import { normalizeImageFile } from "../../lib/fileUtils";
import { toast } from "../../store/useToastStore";

interface Props {
  value: string | null;
  onChange: (dataUri: string | null) => void;
  label?: string;
  hint?: string;
  className?: string;
}

export function UploadZone({ value, onChange, label = "上传图片", hint, className = "" }: Props) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | File[]) {
    const file = Array.from(files).find((f) => f.type.startsWith("image/"));
    if (!file) return;
    try {
      const dataUri = await normalizeImageFile(file);
      onChange(dataUri);
    } catch (e) {
      toast.danger(e instanceof Error ? e.message : "图片处理失败");
    }
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
  }

  async function onPaste(e: React.ClipboardEvent) {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.kind === "file" && item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) handleFiles([file]);
      }
    }
  }

  if (value) {
    return (
      <div className={`group relative overflow-hidden rounded-control border border-border-subtle ${className}`}>
        <img src={value} alt={label} className="h-full w-full object-cover" />
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-label="移除图片"
          className="focus-ring absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100"
        >
          <Icon name="close" size={14} />
        </button>
      </div>
    );
  }

  return (
    <div
      tabIndex={0}
      onPaste={onPaste}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
      className={`focus-ring flex cursor-pointer flex-col items-center justify-center gap-2 rounded-control border-2 border-dashed p-4 text-center transition-colors ${
        dragging ? "border-accent-violet bg-accent-violet/5" : "border-border-strong bg-black/[0.015] dark:bg-white/[0.02] hover:border-text-muted"
      } ${className}`}
    >
      <Icon name="upload" size={22} className="text-text-muted" />
      <span className="text-xs text-text-secondary">{label}</span>
      {hint && <span className="text-[11px] text-text-muted">{hint}</span>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />
    </div>
  );
}

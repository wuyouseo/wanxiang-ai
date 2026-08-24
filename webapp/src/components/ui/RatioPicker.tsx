function ratioBoxSize(ratio: string): { w: number; h: number } {
  const [a, b] = ratio.split(":").map(Number);
  const max = 26;
  if (a >= b) return { w: max, h: Math.max(10, Math.round((max * b) / a)) };
  return { w: Math.max(10, Math.round((max * a) / b)), h: max };
}

export function RatioPicker<T extends string>({
  options,
  value,
  onChange,
}: {
  options: T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {options.map((opt) => {
        const { w, h } = ratioBoxSize(opt);
        const active = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`focus-ring flex w-14 flex-col items-center gap-1.5 rounded-control border px-2 py-2 transition-colors ${
              active
                ? "border-accent-violet/60 bg-accent-violet/10"
                : "border-border-subtle bg-black/[0.015] dark:bg-white/[0.02] hover:border-border-strong"
            }`}
          >
            <span className="flex h-7 w-7 items-center justify-center">
              <span
                className={`rounded-[3px] border-2 ${active ? "border-accent-violet" : "border-text-muted"}`}
                style={{ width: w, height: h }}
              />
            </span>
            <span className={`text-[11px] ${active ? "text-text-primary" : "text-text-muted"}`}>{opt}</span>
          </button>
        );
      })}
    </div>
  );
}

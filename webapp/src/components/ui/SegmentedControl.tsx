export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  labels,
}: {
  options: T[];
  value: T;
  onChange: (v: T) => void;
  labels?: Partial<Record<T, string>>;
}) {
  return (
    <div className="inline-flex flex-wrap gap-1.5">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`focus-ring rounded-control border px-3.5 py-1.5 text-sm transition-colors ${
            value === opt
              ? "border-transparent bg-accent-gradient text-white"
              : "border-border-subtle bg-black/[0.015] dark:bg-white/[0.02] text-text-secondary hover:border-border-strong hover:text-text-primary"
          }`}
        >
          {labels?.[opt] ?? opt}
        </button>
      ))}
    </div>
  );
}

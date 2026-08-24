export function Slider({
  min,
  max,
  step = 1,
  value,
  onChange,
  suffix = "",
}: {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
}) {
  return (
    <div className="flex flex-1 items-center gap-4">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-surface2 accent-accent-violet"
      />
      <span className="w-20 flex-shrink-0 text-sm text-text-secondary">
        {value}
        {suffix}
      </span>
    </div>
  );
}

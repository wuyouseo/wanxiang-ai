export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`focus-ring relative h-6 w-11 flex-shrink-0 rounded-full border transition-colors ${
        checked ? "border-accent-violet bg-accent-violet" : "border-border-strong bg-surface2"
      }`}
    >
      <span
        className={`absolute left-0 top-0.5 h-4.5 w-4.5 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.35)] transition-transform ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
        style={{ height: 18, width: 18 }}
      />
    </button>
  );
}

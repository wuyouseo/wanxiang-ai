import { useState } from "react";
import { Icon } from "../icons/Icon";

export function AccordionItem({
  question,
  answer,
  defaultOpen = false,
}: {
  question: string;
  answer: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-border-subtle">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="focus-ring flex w-full items-center justify-between gap-4 py-5 text-left"
      >
        <span className="text-sm font-medium text-text-primary sm:text-base">{question}</span>
        <Icon
          name="chevronDown"
          size={17}
          className={`flex-shrink-0 text-text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <p className="pb-5 text-sm leading-relaxed text-text-secondary">{answer}</p>}
    </div>
  );
}

"use client";

export function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  hint?: string;
}) {
  const knob = (
    <span
      className="relative inline-block h-6 w-11 shrink-0 rounded-full border align-middle transition"
      style={{
        borderColor: checked ? "transparent" : "var(--line-2)",
        background: checked
          ? "linear-gradient(135deg, var(--accent), var(--accent-2))"
          : "var(--wash)",
      }}
    >
      <span
        className={`absolute top-[0.1875rem] size-[1.125rem] rounded-full transition-all duration-200 ${
          checked ? "left-[1.4375rem]" : "left-[0.1875rem]"
        }`}
        style={{
          background: checked ? "var(--on-accent)" : "var(--muted)",
          transitionTimingFunction: "var(--ease-out-expo)",
        }}
      />
    </span>
  );

  // Mode compact : juste l'interrupteur (ex. dans l'en-tête d'une carte).
  if (!label) {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
      >
        {knob}
      </button>
    );
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 text-left"
    >
      <span>
        <span className="block text-sm font-medium text-foreground">{label}</span>
        {hint && <span className="mt-0.5 block text-xs text-muted">{hint}</span>}
      </span>
      {knob}
    </button>
  );
}

"use client";

import { useId } from "react";
import { Check, Info } from "lucide-react";
import { cn } from "@/lib/utils";

/** Pill-shaped text field shared by every input in the calculator. */
export const fieldClass = cn(
  "w-full rounded-full border border-border bg-surface px-5 py-3 text-ink",
  "shadow-[inset_0_1px_2px_rgba(24,50,31,0.05)] transition-colors",
  "focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25",
);

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-[1.75rem] border border-border/70 bg-surface p-5 sm:p-8",
        "shadow-[0_28px_60px_-36px_rgba(24,50,31,0.45)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function NumberField({
  label,
  help,
  value,
  onChange,
  suffix,
}: {
  label: string;
  help?: string;
  value: string;
  onChange: (v: string) => void;
  suffix?: string;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="block px-1 text-sm font-medium text-ink">
        {label}
      </label>
      <div className="relative mt-2">
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-describedby={help ? `${id}-help` : undefined}
          className={cn(fieldClass, suffix && "pe-16")}
        />
        {suffix && (
          <span className="pointer-events-none absolute inset-y-0 end-5 flex items-center text-xs text-ink-muted">
            {suffix}
          </span>
        )}
      </div>
      {help && (
        <p id={`${id}-help`} className="mt-1.5 px-1 text-xs text-ink-muted">
          {help}
        </p>
      )}
    </div>
  );
}

export function Checkbox({
  label,
  help,
  checked,
  onChange,
}: {
  label: string;
  help?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  const id = useId();
  return (
    <div className="flex items-start gap-3">
      <span className="relative mt-0.5 inline-flex size-5 shrink-0">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className={cn(
            "peer size-5 cursor-pointer appearance-none rounded-md border border-border bg-surface transition-colors",
            "checked:border-primary-deep checked:bg-primary-deep",
          )}
        />
        <Check
          aria-hidden
          strokeWidth={3}
          className="pointer-events-none absolute inset-0 m-auto size-3 text-primary-foreground opacity-0 peer-checked:opacity-100"
        />
      </span>
      <label htmlFor={id} className="cursor-pointer text-sm text-ink">
        {label}
        {help && <span className="mt-0.5 block text-xs text-ink-muted">{help}</span>}
      </label>
    </div>
  );
}

export function RadioCards<T extends string>({
  legend,
  value,
  options,
  onChange,
}: {
  legend: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  const name = useId();
  return (
    <fieldset>
      <legend className="px-1 text-sm font-medium text-ink">{legend}</legend>
      <div className="mt-2 grid gap-2">
        {options.map((o) => (
          <label
            key={o.value}
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-3xl border px-5 py-3 text-sm transition-colors",
              value === o.value
                ? "border-primary bg-primary-subtle text-ink"
                : "border-border bg-surface text-ink-muted hover:border-primary/60",
            )}
          >
            <input
              type="radio"
              name={name}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
              className="mt-1 accent-[var(--primary-deep)]"
            />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={cn("flex items-baseline justify-between gap-4 py-2 text-sm", strong && "font-bold text-ink")}>
      <dt className={strong ? "" : "text-ink-muted"}>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}

export function Message({ children, tone = "info" }: { children: React.ReactNode; tone?: "info" | "due" }) {
  return (
    <div
      role="status"
      className={cn(
        "flex gap-2 rounded-2xl border px-4 py-3 text-sm",
        tone === "due" ? "border-primary bg-primary-subtle text-ink" : "border-border bg-surface-raised text-ink-muted",
      )}
    >
      <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div>{children}</div>
    </div>
  );
}

export function BigResult({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-gradient-to-r from-primary-deep to-primary px-5 py-4 text-primary-foreground">
      <p className="text-sm opacity-90">{label}</p>
      <p className="mt-1 font-display text-3xl tabular-nums">{value}</p>
    </div>
  );
}

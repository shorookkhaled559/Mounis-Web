"use client";

import { useId } from "react";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-border bg-surface p-5 sm:p-6", className)}>{children}</div>
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
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
      </label>
      <div className="relative mt-1.5">
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-describedby={help ? `${id}-help` : undefined}
          className={cn(
            "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-ink",
            "focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30",
            suffix && "pe-14",
          )}
        />
        {suffix && (
          <span className="pointer-events-none absolute inset-y-0 end-3 flex items-center text-xs text-ink-muted">
            {suffix}
          </span>
        )}
      </div>
      {help && (
        <p id={`${id}-help`} className="mt-1 text-xs text-ink-muted">
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
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 size-4 accent-[var(--primary)]"
      />
      <label htmlFor={id} className="text-sm text-ink">
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
      <legend className="text-sm font-medium text-ink">{legend}</legend>
      <div className="mt-1.5 grid gap-2">
        {options.map((o) => (
          <label
            key={o.value}
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 text-sm",
              value === o.value ? "border-primary bg-primary-subtle text-ink" : "border-border bg-background text-ink-muted",
            )}
          >
            <input
              type="radio"
              name={name}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
              className="mt-1 accent-[var(--primary)]"
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
    <div className={cn("flex items-baseline justify-between gap-4 py-1.5 text-sm", strong && "font-bold text-ink")}>
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
        "flex gap-2 rounded-xl border px-4 py-3 text-sm",
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
    <div className="rounded-2xl bg-primary px-5 py-4 text-primary-foreground">
      <p className="text-sm opacity-90">{label}</p>
      <p className="mt-1 font-display text-3xl tabular-nums">{value}</p>
    </div>
  );
}

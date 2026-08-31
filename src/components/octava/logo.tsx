import { cn } from "@/lib/utils";

export function CassetteMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("text-accent", className)}
      aria-hidden="true"
    >
      <rect
        x="3"
        y="7"
        width="26"
        height="18"
        rx="4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <rect x="11" y="11" width="10" height="6" rx="1.2" fill="currentColor" opacity="0.35" />
      <circle cx="9.5" cy="14" r="2.4" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="22.5" cy="14" r="2.4" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="9.5" cy="14" r="0.7" fill="currentColor" />
      <circle cx="22.5" cy="14" r="0.7" fill="currentColor" />
      <path
        d="M8 22h16"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.7"
      />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5 text-fg", className)}>
      <CassetteMark className="size-8" />
      <span className="font-display text-2xl leading-none tracking-tight">Octava</span>
    </span>
  );
}

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ChevronDown, Copy, Terminal, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { clearExtractorLog, getExtractorLog } from "@/lib/media.functions";
import type { YtLogLevel } from "@/lib/media";
import {
  clearYtLogLocal,
  getYtLines,
  serverCursor,
  subscribeYtLog,
  mergeYtServer,
  setYtDownloadRatio,
} from "@/lib/yt-log-client";
import { cn } from "@/lib/utils";

type Props = {
  busy?: boolean;
};

const LEVEL_LABEL: Record<YtLogLevel, string> = {
  info: "info",
  warn: "warn",
  error: "err",
  ok: "ok",
};

export function YtConsole({ busy = false }: Props) {
  const lines = useSyncExternalStore(subscribeYtLog, getYtLines, getYtLines);
  const [open, setOpen] = useState(false);
  const lastError = [...lines].reverse().find((l) => l.level === "error");
  const last = lines[lines.length - 1];
  const status =
    lastError && (!last || last.t - lastError.t < 8_000) ? lastError : last;

  useYtLogPoll(busy || open);

  useEffect(() => {
    if (lastError && Date.now() - lastError.t < 15_000) setOpen(true);
  }, [lastError?.id]);

  async function onClear() {
    clearYtLogLocal();
    try {
      await clearExtractorLog();
    } catch {
      /* local already empty */
    }
  }

  async function onCopy() {
    const text = lines.map((l) => l.text).join("\n");
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Консоль скопирована");
    } catch {
      toast.error("Не удалось скопировать");
    }
  }

  const statusText =
    status?.text ?? (busy ? "yt-dlp работает…" : "yt-dlp · ожидание запроса");

  return (
    <section
      id="octava-console"
      className="rounded-lg bg-surface shadow-[var(--shadow-border)]"
    >
      <div className="flex items-stretch gap-1">
        <button
          id="octava-console-toggle"
          type="button"
          aria-expanded={open}
          aria-controls="octava-console-log"
          onClick={() => setOpen((v) => !v)}
          className="flex min-h-11 min-w-0 flex-1 items-center gap-2 px-4 py-2 text-left"
        >
          <Terminal
            className={cn(
              "size-4 shrink-0",
              status?.level === "error" ? "text-danger" : "text-accent",
            )}
          />
          <span
            id="octava-console-status"
            aria-live="polite"
            className={cn(
              "min-w-0 flex-1 truncate font-mono text-xs",
              status?.level === "error" ? "text-danger" : "text-muted",
            )}
          >
            {statusText}
          </span>
          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-subtle transition-transform duration-[var(--motion-quick)]",
              open && "rotate-180",
            )}
          />
        </button>
        {lines.length > 0 ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="my-1 mr-1"
            aria-label="Очистить консоль"
            id="octava-console-clear"
            onClick={() => void onClear()}
          >
            <Trash2 className="size-4" />
          </Button>
        ) : null}
      </div>

      {open ? (
        <div className="border-t border-line px-3 pb-3 pt-2">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs font-medium tracking-wide text-subtle uppercase">
              Консоль yt-dlp
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={lines.length === 0}
              onClick={() => void onCopy()}
            >
              <Copy className="size-4" />
              Копировать
            </Button>
          </div>
          <YtLogPane id="octava-console-log" />
        </div>
      ) : null}
    </section>
  );
}

export function YtLogPane({
  id,
  className,
}: {
  id?: string;
  className?: string;
}) {
  const lines = useSyncExternalStore(subscribeYtLog, getYtLines, getYtLines);
  const scroller = useRef<HTMLDivElement>(null);
  const last = lines[lines.length - 1];

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [lines.length, last?.id, last?.text]);

  return (
    <div
      id={id}
      ref={scroller}
      role="log"
      className={cn(
        "max-h-40 overflow-auto rounded-md bg-raised px-3 py-2 font-mono text-xs leading-relaxed",
        className,
      )}
    >
      {lines.length === 0 ? (
        <p className="text-subtle">
          Здесь stderr yt-dlp: ошибки, предупреждения и ход загрузки.
        </p>
      ) : (
        <ul className="space-y-1">
          {lines.map((line) => (
            <li key={`${line.id}-${line.t}`} className="flex gap-2">
              <span
                className={cn(
                  "w-8 shrink-0 uppercase",
                  line.level === "error"
                    ? "text-danger"
                    : line.level === "ok"
                      ? "text-accent"
                      : line.level === "warn"
                        ? "text-muted"
                        : "text-subtle",
                )}
              >
                {LEVEL_LABEL[line.level]}
              </span>
              <span
                className={cn(
                  "min-w-0 whitespace-pre-wrap break-all",
                  line.level === "error" ? "text-danger" : "text-fg",
                )}
              >
                {line.text}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function useYtLogPoll(active = false) {
  useEffect(() => {
    let alive = true;
    async function tick() {
      try {
        const next = await getExtractorLog({ data: { after: serverCursor() } });
        if (!alive) return;
        mergeYtServer(next?.lines);
        setYtDownloadRatio(next?.progress, next?.epoch);
      } catch {
        /* console is best-effort */
      }
    }
    void tick();
    const ms = active ? 300 : 4000;
    const id = window.setInterval(() => void tick(), ms);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [active]);
}

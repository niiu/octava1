import type { ErrorComponentProps } from "@tanstack/react-router";
import { TriangleAlert } from "lucide-react";

export function AppErrorComponent({ error, reset }: ErrorComponentProps) {
  const message =
    error instanceof Error && error.message.trim()
      ? error.message
      : "Неожиданная ошибка. Вернитесь на главную и попробуйте снова.";

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-bg px-6 text-center text-fg">
      <span className="text-danger" aria-hidden="true">
        <TriangleAlert className="size-10" strokeWidth={2} />
      </span>
      <h1 className="font-display text-xl tracking-tight">Что-то сломалось</h1>
      <p className="max-w-md text-sm break-words text-muted">{message}</p>
      <button
        type="button"
        className="mt-2 h-10 rounded-md bg-fg px-4 text-sm text-bg"
        onClick={() => {
          if (typeof reset === "function") reset();
          else window.location.assign("/");
        }}
      >
        На главную
      </button>
    </main>
  );
}

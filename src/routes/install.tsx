import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Copy, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/octava/logo";
import { toast } from "sonner";

export const Route = createFileRoute("/install")({ component: InstallPage });

const FALLBACK_SCRIPT = `#!/usr/bin/env bash
set -euo pipefail
echo "Скачайте install.sh из приложения Octava."
`;

function InstallPage() {
  const [script, setScript] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    void fetch("/install.sh")
      .then((r) => (r.ok ? r.text() : FALLBACK_SCRIPT))
      .then(setScript)
      .catch(() => setScript(FALLBACK_SCRIPT));
  }, []);

  async function copyScript() {
    try {
      await navigator.clipboard.writeText(script);
      setCopied(true);
      toast.success("Скрипт скопирован");
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("Не удалось скопировать");
    }
  }

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <header className="flex items-center justify-between gap-4 px-4 py-4 md:px-8">
        <Link to="/">
          <Wordmark />
        </Link>
        <Link
          to="/"
          className="inline-flex h-11 items-center rounded-md px-3 text-sm text-muted hover:bg-raised hover:text-fg"
        >
          К загрузчику
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 pb-16 md:px-8">
        <div>
          <p className="text-xs font-medium tracking-wide text-subtle uppercase">Самостоятельный хост</p>
          <h1 className="mt-2 font-display text-4xl leading-tight tracking-tight">
            Автоустановка
          </h1>
          <p className="mt-3 max-w-xl text-muted">
            YouTube часто режет загрузки с облачных IP. Скрипт ставит yt-dlp, проверяет
            ffmpeg и поднимает Octava у вас на машине — там скачивание и ZIP обычно
            работают.
          </p>
        </div>

        <ol className="space-y-4 text-sm">
          <li className="rounded-lg bg-surface p-4 shadow-[var(--shadow-border)]">
            <p className="font-medium">1. Скачайте проект и скрипт</p>
            <p className="mt-1 text-muted">
              Положите <span className="font-mono text-fg">install.sh</span> в корень
              Octava и сделайте его исполняемым.
            </p>
          </li>
          <li className="rounded-lg bg-surface p-4 shadow-[var(--shadow-border)]">
            <p className="font-medium">2. Запустите один раз</p>
            <pre className="mt-2 overflow-x-auto rounded-md bg-raised px-3 py-2 font-mono text-xs">
              bash install.sh
            </pre>
            <p className="mt-2 text-muted">
              Скрипт поставит зависимости Node, скачает yt-dlp в{" "}
              <span className="font-mono text-fg">bin/</span>, проверит ffmpeg и
              запустит веб-морду.
            </p>
          </li>
          <li className="rounded-lg bg-surface p-4 shadow-[var(--shadow-border)]">
            <p className="font-medium">3. Cookies — если YouTube просит войти</p>
            <p className="mt-1 text-muted">
              Экспортируйте cookies.txt из браузера и положите в корень проекта. Octava
              подхватит файл автоматически.
            </p>
          </li>
        </ol>

        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <a href="/install.sh" download="install.sh">
              <Download className="size-4" />
              Скачать install.sh
            </a>
          </Button>
          <Button variant="secondary" onClick={() => void copyScript()}>
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            Копировать
          </Button>
        </div>

        <pre className="max-h-96 overflow-auto rounded-lg bg-raised p-4 font-mono text-xs leading-relaxed text-fg shadow-[var(--shadow-border)]">
          {script || "Загружаем скрипт…"}
        </pre>
      </main>
    </div>
  );
}

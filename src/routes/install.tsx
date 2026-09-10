import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Copy, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/octava/logo";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/install")({ component: InstallPage });

const FALLBACK_SH = `#!/usr/bin/env bash
set -euo pipefail
echo "Скачайте install.sh из приложения Octava."
`;

const FALLBACK_PS1 = `# Скачайте install.ps1 из приложения Octava.
Write-Host "Скачайте install.ps1 из приложения Octava."
`;

function InstallPage() {
  const [os, setOs] = useState<"linux" | "windows">("linux");
  const [scriptSh, setScriptSh] = useState("");
  const [scriptPs1, setScriptPs1] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const win = typeof navigator !== "undefined" && /windows/i.test(navigator.userAgent);
    if (win) setOs("windows");
    void fetch("/install.sh")
      .then((r) => (r.ok ? r.text() : FALLBACK_SH))
      .then(setScriptSh)
      .catch(() => setScriptSh(FALLBACK_SH));
    void fetch("/install.ps1")
      .then((r) => (r.ok ? r.text() : FALLBACK_PS1))
      .then(setScriptPs1)
      .catch(() => setScriptPs1(FALLBACK_PS1));
  }, []);

  const windows = os === "windows";
  const script = windows ? scriptPs1 : scriptSh;
  const filename = windows ? "install.ps1" : "install.sh";

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
          <h1 className="mt-2 font-display text-4xl leading-tight tracking-tight">Автоустановка</h1>
          <p className="mt-3 max-w-xl text-muted">
            YouTube часто режет загрузки с облачных IP. Скрипт ставит Node.js LTS, Python 3.11+,
            ffmpeg, yt-dlp и поднимает Octava как фоновую службу. Задания качаются на машине:
            обрыв сети или перезагрузка вкладки их не сбрасывают.
          </p>
        </div>

        <div className="flex rounded-md bg-raised p-1 shadow-[var(--shadow-border)] self-start">
          <button
            type="button"
            className={cn(
              "h-8 rounded-sm px-3 text-xs font-medium",
              !windows ? "bg-fg text-bg" : "text-muted hover:text-fg",
            )}
            onClick={() => setOs("linux")}
          >
            Linux / macOS
          </button>
          <button
            type="button"
            className={cn(
              "h-8 rounded-sm px-3 text-xs font-medium",
              windows ? "bg-fg text-bg" : "text-muted hover:text-fg",
            )}
            onClick={() => setOs("windows")}
          >
            Windows
          </button>
        </div>

        {windows ? (
          <ol className="space-y-4 text-sm">
            <li className="rounded-lg bg-surface p-4 shadow-[var(--shadow-border)]">
              <p className="font-medium">1. Скачайте проект и скрипт</p>
              <p className="mt-1 text-muted">
                Клонируйте репозиторий или распакуйте ZIP.{" "}
                <span className="font-mono text-fg">install.ps1</span> должен лежать в корне Octava.
              </p>
            </li>
            <li className="rounded-lg bg-surface p-4 shadow-[var(--shadow-border)]">
              <p className="font-medium">2. Запустите PowerShell в корне проекта</p>
              <pre className="mt-2 overflow-x-auto rounded-md bg-raised px-3 py-2 font-mono text-xs">
                powershell -ExecutionPolicy Bypass -File .\install.ps1
              </pre>
              <p className="mt-2 text-muted">
                Скрипт спросит порт (по умолчанию 8787 — 8080 часто занят llama), поставит
                портативный Node.js LTS, Python 3.12, ffmpeg и yt-dlp.exe в{" "}
                <span className="font-mono text-fg">.runtime\</span>, соберёт production и
                запустит службу. Можно сразу:{" "}
                <span className="font-mono text-fg">.\install.ps1 -Port 8787</span>
              </p>
            </li>
            <li className="rounded-lg bg-surface p-4 shadow-[var(--shadow-border)]">
              <p className="font-medium">3. Управление службой</p>
              <pre className="mt-2 overflow-x-auto rounded-md bg-raised px-3 py-2 font-mono text-xs leading-relaxed">
                {`.\\bin\\octava.cmd start 8787
.\\bin\\octava.cmd stop
.\\bin\\octava.cmd status
.\\bin\\octava.cmd logs
.\\bin\\octava.cmd enable 8787`}
              </pre>
              <p className="mt-2 text-muted">
                Порт задаётся при установке и запоминается. Сменить:{" "}
                <span className="font-mono text-fg">.\bin\octava.cmd start 9090</span>. Передний план:{" "}
                <span className="font-mono text-fg">.\install.ps1 -Foreground</span>
              </p>
            </li>
            <li className="rounded-lg bg-surface p-4 shadow-[var(--shadow-border)]">
              <p className="font-medium">4. Cookies YouTube</p>
              <p className="mt-1 text-muted">
                На главной есть поле cookies. Можно также положить cookies.txt в корень проекта.
              </p>
            </li>
          </ol>
        ) : (
          <ol className="space-y-4 text-sm">
            <li className="rounded-lg bg-surface p-4 shadow-[var(--shadow-border)]">
              <p className="font-medium">1. Скачайте проект и скрипт</p>
              <p className="mt-1 text-muted">
                Положите <span className="font-mono text-fg">install.sh</span> в корень Octava и
                сделайте его исполняемым.
              </p>
            </li>
            <li className="rounded-lg bg-surface p-4 shadow-[var(--shadow-border)]">
              <p className="font-medium">2. Запустите один раз</p>
              <pre className="mt-2 overflow-x-auto rounded-md bg-raised px-3 py-2 font-mono text-xs">
                bash install.sh
              </pre>
              <p className="mt-2 text-muted">
                Скрипт поставит Node.js LTS, Python 3.11+ (3.10 yt-dlp уже не берёт), ffmpeg, свежий
                yt-dlp, соберёт production и запустит службу (на Ubuntu — systemd --user). Нужен sudo
                для системных пакетов; если NodeSource недоступен, Node кладётся в{" "}
                <span className="font-mono text-fg">.runtime/</span>.
              </p>
            </li>
            <li className="rounded-lg bg-surface p-4 shadow-[var(--shadow-border)]">
              <p className="font-medium">3. Управление службой</p>
              <pre className="mt-2 overflow-x-auto rounded-md bg-raised px-3 py-2 font-mono text-xs leading-relaxed">
                {`octava start
octava stop
octava status
octava logs
systemctl --user enable --now octava`}
              </pre>
              <p className="mt-2 text-muted">
                После reboot служба поднимается сама, если выполнен enable. Передний план:{" "}
                <span className="font-mono text-fg">bash install.sh --foreground</span>
              </p>
            </li>
            <li className="rounded-lg bg-surface p-4 shadow-[var(--shadow-border)]">
              <p className="font-medium">4. Cookies YouTube</p>
              <p className="mt-1 text-muted">
                На главной есть поле cookies и кнопка экспорта (с вашим согласием). Можно также
                положить cookies.txt в корень проекта — движок подхватит файл.
              </p>
            </li>
          </ol>
        )}

        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <a href={`/${filename}`} download={filename}>
              <Download className="size-4" />
              Скачать {filename}
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

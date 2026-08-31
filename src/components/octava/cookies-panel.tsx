import { useEffect, useRef, useState } from "react";
import { Check, Cookie, Copy, FileUp, LoaderCircle, Save, Trash2, Youtube } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cookieCountLabel, countCookieRows, isLikelyCookieFile, normalizeCookieFile } from "@/lib/cookie-file";
import {
  clearStoredCookies,
  loadCookieConsent,
  loadStoredCookies,
  saveCookieConsent,
  saveStoredCookies,
} from "@/lib/cookies-client";
import {
  clearYoutubeCookies,
  exportYoutubeCookies,
  saveYoutubeCookies,
} from "@/lib/media.functions";

type Props = {
  value: string;
  onChange: (next: string) => void;
  savedCount: number;
  onStatus: (count: number) => void;
};

const YT_EXPORT_BOOKMARKLET =
  "javascript:void(async function(){var h=location.hostname;if(!/(^|\\.)youtube\\.com$/.test(h)&&h!=='youtu.be'){alert('Откройте youtube.com и нажмите закладку снова');return;}var lines=['# Netscape HTTP Cookie File'];document.cookie.split(';').forEach(function(p){p=p.trim();var i=p.indexOf('=');if(i<1)return;var n=p.slice(0,i),v=p.slice(i+1);lines.push('.youtube.com\\tTRUE\\t/\\tTRUE\\t0\\t'+n+'\\t'+v);});var t=lines.join('\\n')+'\\n';try{await navigator.clipboard.writeText(t);alert('Cookies скопированы. Вернитесь в Octava и вставьте в поле.');}catch(e){prompt('Скопируйте cookies:',t);}})();";

export function CookiesPanel({ value, onChange, savedCount, onStatus }: Props) {
  const [exportOpen, setExportOpen] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const emptyField = !value.trim();
  const empty = emptyField && savedCount <= 0;
  const rows = savedCount || countCookieRows(value);

  const onStatusRef = useRef(onStatus);
  onStatusRef.current = onStatus;

  useEffect(() => {
    setAgreed(loadCookieConsent());
    const stored = loadStoredCookies();
    if (stored) onStatusRef.current(countCookieRows(stored));
  }, []);

  async function persist(raw: string, source: string) {
    setBusy(true);
    try {
      const normalized = normalizeCookieFile(raw);
      const localCount = countCookieRows(normalized);
      saveStoredCookies(normalized);
      let count = localCount;
      try {
        const status = await saveYoutubeCookies({
          data: { cookies: normalized },
        });
        count = status.count;
      } catch {
        /* client storage still holds the cookies */
      }
      onChange("");
      onStatus(count);
      toast.success(`${source}: ${cookieCountLabel(count)}`);
    } catch (err) {
      onChange(raw);
      toast.error(err instanceof Error ? err.message : "Не удалось сохранить cookies");
    } finally {
      setBusy(false);
    }
  }

  function fieldValue() {
    return areaRef.current?.value ?? value;
  }

  function onPickFile(file: File | undefined) {
    if (!file) return;
    void file.text().then((text) => persist(text, file.name));
  }

  async function clear() {
    setBusy(true);
    try {
      clearStoredCookies();
      await clearYoutubeCookies();
      onChange("");
      onStatus(0);
      toast.message("Cookies удалены");
    } catch (err) {
      onChange("");
      onStatus(0);
      toast.message("Cookies удалены в браузере");
    } finally {
      setBusy(false);
    }
  }

  function openExport() {
    setAgreed(false);
    setExportOpen(true);
  }

  async function copyBookmarklet() {
    if (!agreed) {
      toast.message("Нужно согласие, чтобы продолжить");
      return;
    }
    saveCookieConsent(true);
    try {
      await navigator.clipboard.writeText(YT_EXPORT_BOOKMARKLET);
      toast.success("Букмарклет скопирован — откройте YouTube и вставьте в закладки");
    } catch {
      toast.error("Не удалось скопировать букмарклет");
    }
  }

  async function confirmExport() {
    if (!agreed) {
      toast.message("Нужно согласие, чтобы продолжить");
      return;
    }
    saveCookieConsent(true);
    setBusy(true);
    try {
      const status = await exportYoutubeCookies({ data: { consent: true } });
      onChange("");
      onStatus(status.count);
      setExportOpen(false);
      toast.success(`Экспорт из ${status.browser}: ${cookieCountLabel(status.count)}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Экспорт не удался");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      aria-labelledby="octava-cookies-label"
      data-empty={empty ? "1" : "0"}
      className="rounded-lg bg-surface p-4 shadow-[var(--shadow-border)]"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label
          id="octava-cookies-label"
          htmlFor="octava-cookies"
          className="flex items-center gap-2 text-sm font-medium"
        >
          <Cookie className="size-4 text-accent" />
          Cookies YouTube
        </label>
        <p className="text-xs text-muted">
          {empty
            ? "не заданы — без них YouTube часто режет загрузку"
            : `${cookieCountLabel(rows)} заданы`}
        </p>
      </div>

      {empty ? (
        <p className="mt-2 text-sm text-muted">
          Поле пустое. Экспорт только после вашего согласия: букмарклет на youtube.com
          или cookies.txt.
        </p>
      ) : (
        <p className="mt-2 text-sm text-muted">
          Значения скрыты. Вставьте новые в поле, чтобы заменить.
        </p>
      )}

      <Textarea
        id="octava-cookies"
        name="cookies"
        ref={areaRef}
        value={value}
        rows={3}
        onChange={(e) => onChange(e.target.value)}
        onPaste={() => {
          window.requestAnimationFrame(() => {
            const live = areaRef.current?.value;
            if (typeof live === "string") onChange(live);
          });
        }}
        onBlur={() => {
          const live = fieldValue();
          if (live.trim() && isLikelyCookieFile(live)) {
            void persist(live, "Поле");
          }
        }}
        onDrop={(e) => {
          const file = e.dataTransfer.files?.[0];
          if (!file) return;
          e.preventDefault();
          onPickFile(file);
        }}
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        placeholder="# Netscape HTTP Cookie File — вставьте экспорт YouTube"
        className="mt-3 min-h-16 max-h-48"
      />
      <input
        ref={fileRef}
        type="file"
        accept=".txt,.json,text/plain,application/json"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          onPickFile(e.target.files?.[0]);
          e.currentTarget.value = "";
        }}
      />
      <div className="mt-3 flex flex-wrap gap-2">
        {empty ? (
          <Button
            id="octava-cookies-export"
            type="button"
            variant="sage"
            disabled={busy}
            onClick={openExport}
          >
            {busy ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Youtube className="size-4" />
            )}
            Экспорт cookies YouTube
          </Button>
        ) : null}
        {value.trim() ? (
          <Button
            id="octava-cookies-save"
            type="button"
            variant="sage"
            disabled={busy}
            onClick={() => void persist(fieldValue(), "Поле")}
          >
            {busy ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            Сохранить
          </Button>
        ) : null}
        {!empty ? (
          <Button
            id="octava-cookies-clear"
            type="button"
            variant="secondary"
            disabled={busy}
            onClick={() => void clear()}
          >
            <Trash2 className="size-4" />
            Очистить
          </Button>
        ) : null}
        <Button
          id="octava-cookies-file"
          type="button"
          variant="secondary"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
        >
          <FileUp className="size-4" />
          Файл cookies.txt
        </Button>
      </div>

      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent className="max-h-dvh overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Экспорт cookies YouTube</DialogTitle>
            <DialogDescription>
              Нужно ваше согласие. Octava не читает чужие вкладки сама: после согласия
              вы сами переносите cookies с youtube.com в поле ниже.
            </DialogDescription>
          </DialogHeader>
          <ol className="space-y-2 text-sm text-muted">
            <li>1. Отметьте согласие.</li>
            <li>2. Откройте YouTube и войдите в свой аккаунт.</li>
            <li>
              3. Скопируйте букмарклет, добавьте в закладки, нажмите его на youtube.com —
              затем вставьте результат в поле.
            </li>
          </ol>
          <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-md bg-raised p-3 text-sm">
            <Checkbox
              id="octava-cookies-consent"
              checked={agreed}
              onCheckedChange={(v) => setAgreed(v === true)}
              className="mt-0.5"
            />
            <span>
              Разрешаю Octava использовать мои cookies YouTube только для скачивания
              аудио в этом приложении. Не передавать их третьим лицам.
            </span>
          </label>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              id="octava-open-youtube"
              type="button"
              variant="secondary"
              onClick={() =>
                window.open("https://www.youtube.com/", "_blank", "noopener,noreferrer")
              }
            >
              <Youtube className="size-4" />
              Открыть YouTube
            </Button>
            <Button
              id="octava-copy-bookmarklet"
              type="button"
              variant="secondary"
              disabled={!agreed}
              onClick={() => void copyBookmarklet()}
            >
              <Copy className="size-4" />
              Скопировать букмарклет
            </Button>
            <Button
              id="octava-cookies-consent-ok"
              type="button"
              disabled={!agreed || busy}
              onClick={() => void confirmExport()}
            >
              {busy ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Check className="size-4" />
              )}
              Согласен, взять из браузера
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

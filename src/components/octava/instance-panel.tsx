import { useState } from "react";
import { Layers } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  getInstanceId,
  instanceLabel,
  isInstanceId,
  rotateInstanceId,
  setInstanceId,
} from "@/lib/instance";

export function InstancePanel() {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const id = getInstanceId();
  const label = instanceLabel(id);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(id);
      toast.success("Код инстанса скопирован");
    } catch {
      toast.error("Не удалось скопировать");
    }
  }

  function join() {
    try {
      setInstanceId(code);
      toast.success("Инстанс подключён");
      window.location.reload();
    } catch {
      toast.error("Некорректный код. Пример: ins_ab12cd34");
    }
  }

  function reset() {
    rotateInstanceId();
    toast.success("Новый инстанс на этом устройстве");
    window.location.reload();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setCode("");
          setOpen(true);
        }}
        className="inline-flex h-11 items-center gap-2 rounded-md px-3 text-sm text-muted hover:bg-raised hover:text-fg"
        title="Инстанс очереди"
      >
        <Layers className="size-4" />
        <span className="hidden sm:inline">Инстанс</span>
        <span className="font-mono text-xs text-subtle">{label}</span>
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Инстанс очереди</DialogTitle>
            <DialogDescription>
              Телефон и компьютер — разные инстансы, очереди не смешиваются. Чтобы видеть одни и
              те же задания, вставьте код с другого устройства.
            </DialogDescription>
          </DialogHeader>
          <p className="text-xs font-medium tracking-wide text-subtle uppercase">Код этого устройства</p>
          <p className="mt-1 break-all font-mono text-sm">{id}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" onClick={() => void copyCode()}>
              Скопировать
            </Button>
            <Button type="button" variant="secondary" onClick={reset}>
              Новый инстанс
            </Button>
          </div>
          <p className="mt-6 text-xs font-medium tracking-wide text-subtle uppercase">
            Подключить другой
          </p>
          <form
            className="mt-2 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              join();
            }}
          >
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="ins_…"
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
            />
            <Button type="submit" variant="secondary" disabled={!isInstanceId(code)}>
              Войти
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

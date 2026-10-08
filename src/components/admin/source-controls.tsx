"use client";

import { Loader2, RefreshCw } from "lucide-react";
import { useOptimistic, useState, useTransition } from "react";

import { refreshAllSourcesAction, refreshSourceAction, setSourceEnabledAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export function SourceToggle({ id, name, enabled }: { id: string; name: string; enabled: boolean }) {
  const [optimistic, setOptimistic] = useOptimistic(enabled);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  return (
    <span className="flex items-center gap-2">
      <Switch
        checked={optimistic}
        aria-label={`${optimistic ? "Disable" : "Enable"} ${name}`}
        onCheckedChange={(next) =>
          startTransition(async () => {
            setOptimistic(next);
            const result = await setSourceEnabledAction(id, next);
            setError(result.ok ? null : result.error);
          })
        }
      />
      {error && <span className="text-destructive text-xs">{error}</span>}
    </span>
  );
}

export function RefreshSourceButton({ id, name }: { id: string; name: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="ghost"
      size="icon"
      disabled={pending}
      aria-label={`Refresh ${name}`}
      title="Fetch fresh data"
      onClick={() => startTransition(() => refreshSourceAction(id))}
    >
      {pending ? <Loader2 className="animate-spin" /> : <RefreshCw />}
    </Button>
  );
}

export function RefreshAllButton() {
  const [pending, startTransition] = useTransition();
  return (
    <Button variant="outline" disabled={pending} onClick={() => startTransition(() => refreshAllSourcesAction())}>
      {pending ? <Loader2 className="animate-spin" /> : <RefreshCw />}
      Refresh all sources
    </Button>
  );
}

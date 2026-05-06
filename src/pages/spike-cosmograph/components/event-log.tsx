import { useEffect, useRef } from "react";
import { useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";

const MAX_ENTRIES = 50;

export interface LogEntry {
  id: number;
  timestamp: string;
  message: string;
  kind: "info" | "milestone" | "warn";
}

interface EventLogProps {
  entries: LogEntry[];
  className?: string;
}

export function EventLog({ entries, className }: EventLogProps) {
  const { t } = useTranslation();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new entries.
  // biome-ignore lint/correctness/useExhaustiveDependencies: `entries` is a prop — scrolling when it changes is intentional
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries]);

  return (
    <div
      className={cn(
        "flex flex-col rounded-lg border border-border bg-card overflow-hidden",
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("spike.log.title")}
        </h3>
        <span className="text-xs text-muted-foreground">
          {entries.length}/{MAX_ENTRIES}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto font-mono text-xs">
        {entries.length === 0 ? (
          <p className="p-3 text-muted-foreground">{t("spike.log.empty")}</p>
        ) : (
          <ul className="divide-y divide-border/50">
            {entries.map((entry) => (
              <li
                key={entry.id}
                className={cn(
                  "flex gap-2 px-3 py-1.5",
                  entry.kind === "milestone" && "bg-primary/5 text-primary font-medium",
                  entry.kind === "warn" && "bg-destructive/5 text-destructive",
                  entry.kind === "info" && "text-foreground",
                )}
              >
                <span className="shrink-0 text-muted-foreground">{entry.timestamp}</span>
                <span>{entry.message}</span>
              </li>
            ))}
          </ul>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Hook — manages append-only log with cap at MAX_ENTRIES
// ---------------------------------------------------------------------------

let _logIdCounter = 0;

export function makeLogEntry(message: string, kind: LogEntry["kind"] = "info"): LogEntry {
  const now = new Date();
  const ts = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}.${String(now.getMilliseconds()).padStart(3, "0")}`;
  return {
    id: ++_logIdCounter,
    timestamp: ts,
    message,
    kind,
  };
}

/**
 * Append a new entry to the log, capping at MAX_ENTRIES.
 */
export function appendLog(
  prev: LogEntry[],
  message: string,
  kind: LogEntry["kind"] = "info",
): LogEntry[] {
  const next = [...prev, makeLogEntry(message, kind)];
  return next.length > MAX_ENTRIES ? next.slice(next.length - MAX_ENTRIES) : next;
}

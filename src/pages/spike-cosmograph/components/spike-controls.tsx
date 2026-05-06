import { useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AgentCount = 10_000 | 50_000 | 100_000;
export type EdgeDensity = 0 | 5 | 10;
export type TickRate = 30 | 60;
export type HotPathStrategy = "rutaA" | "rutaC" | "rutaD";
export type SpikeStatus = "idle" | "initializing" | "running" | "stopped";

export interface SpikeControlsConfig {
  agentCount: AgentCount;
  edgeDensity: EdgeDensity;
  tickRate: TickRate;
  strategy: HotPathStrategy;
}

interface SpikeControlsProps {
  config: SpikeControlsConfig;
  status: SpikeStatus;
  onConfigChange: (next: Partial<SpikeControlsConfig>) => void;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface RadioGroupProps<T extends string | number> {
  label: string;
  name: string;
  value: T;
  options: { value: T; label: string }[];
  disabled?: boolean;
  onChange: (value: T) => void;
}

function RadioGroup<T extends string | number>({
  label,
  name,
  value,
  options,
  disabled,
  onChange,
}: RadioGroupProps<T>) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <label
            key={String(opt.value)}
            className={cn(
              "flex cursor-pointer items-center gap-1.5 rounded-md border px-2 py-1 text-sm transition-colors",
              value === opt.value
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-background text-foreground hover:bg-accent",
              disabled && "pointer-events-none opacity-50",
            )}
          >
            <input
              type="radio"
              name={name}
              value={String(opt.value)}
              checked={value === opt.value}
              disabled={disabled}
              onChange={() => onChange(opt.value)}
              className="sr-only"
            />
            {opt.label}
          </label>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SpikeControls
// ---------------------------------------------------------------------------

export function SpikeControls({
  config,
  status,
  onConfigChange,
  onStart,
  onStop,
  onReset,
}: SpikeControlsProps) {
  const { t } = useTranslation();
  const busy = status === "initializing" || status === "running";

  const agentOptions: { value: AgentCount; label: string }[] = [
    { value: 10_000, label: t("spike.controls.agents10k") },
    { value: 50_000, label: t("spike.controls.agents50k") },
    { value: 100_000, label: t("spike.controls.agents100k") },
  ];

  const edgeOptions: { value: EdgeDensity; label: string }[] = [
    { value: 0, label: t("spike.controls.edges0") },
    { value: 5, label: t("spike.controls.edges5") },
    { value: 10, label: t("spike.controls.edges10") },
  ];

  const tickOptions: { value: TickRate; label: string }[] = [
    { value: 30, label: t("spike.controls.tick30") },
    { value: 60, label: t("spike.controls.tick60") },
  ];

  const strategyOptions: { value: HotPathStrategy; label: string }[] = [
    { value: "rutaA", label: t("spike.controls.strategyRutaA") },
    { value: "rutaC", label: t("spike.controls.strategyRutaC") },
    { value: "rutaD", label: t("spike.controls.strategyRutaD") },
  ];

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4">
      <h2 className="text-sm font-semibold text-card-foreground">{t("spike.controls.title")}</h2>

      <RadioGroup<AgentCount>
        label={t("spike.controls.agentCountLabel")}
        name="agentCount"
        value={config.agentCount}
        options={agentOptions}
        disabled={busy}
        onChange={(v) => onConfigChange({ agentCount: v })}
      />

      <RadioGroup<EdgeDensity>
        label={t("spike.controls.edgeDensityLabel")}
        name="edgeDensity"
        value={config.edgeDensity}
        options={edgeOptions}
        disabled={busy}
        onChange={(v) => onConfigChange({ edgeDensity: v })}
      />

      <RadioGroup<TickRate>
        label={t("spike.controls.tickRateLabel")}
        name="tickRate"
        value={config.tickRate}
        options={tickOptions}
        disabled={busy}
        onChange={(v) => onConfigChange({ tickRate: v })}
      />

      <RadioGroup<HotPathStrategy>
        label={t("spike.controls.strategyLabel")}
        name="strategy"
        value={config.strategy}
        options={strategyOptions}
        disabled={busy}
        onChange={(v) => onConfigChange({ strategy: v })}
      />

      <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
        {status === "idle" || status === "stopped" ? (
          <Button onClick={onStart} size="sm">
            {t("spike.controls.start")}
          </Button>
        ) : null}

        {status === "running" || status === "initializing" ? (
          <Button onClick={onStop} variant="destructive" size="sm">
            {t("spike.controls.stop")}
          </Button>
        ) : null}

        {status === "initializing" ? (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="inline-block size-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
            {t("spike.controls.initializing")}
          </span>
        ) : null}

        <Button onClick={onReset} variant="outline" size="sm" disabled={status === "initializing"}>
          {t("spike.controls.reset")}
        </Button>
      </div>

      {/* Status badge */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span
          className={cn(
            "inline-block size-2 rounded-full",
            status === "running" && "bg-green-500 animate-pulse",
            status === "initializing" && "bg-yellow-500 animate-pulse",
            status === "idle" && "bg-muted-foreground",
            status === "stopped" && "bg-orange-500",
          )}
        />
        {status === "idle" && t("spike.controls.statusIdle")}
        {status === "initializing" && t("spike.controls.statusInitializing")}
        {status === "running" && t("spike.controls.statusRunning")}
        {status === "stopped" && t("spike.controls.statusStopped")}
      </div>
    </div>
  );
}

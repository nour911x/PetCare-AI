"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Heart,
  Activity,
  TriangleAlert,
  Loader2,
  Lightbulb,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { fetchInsights } from "@/lib/api";
import type { InsightsResponse, InsightTone } from "@/types/api";

const MONTHS_FR = [
  "janv", "févr", "mars", "avr", "mai", "juin",
  "juil", "août", "sept", "oct", "nov", "déc",
];

const EMOTION_EMOJI: Record<string, string> = {
  heureux: "😊",
  calme: "😌",
  joueur: "🤸",
  stresse: "😰",
  anxieux: "😟",
  en_colere: "😡",
  triste: "😢",
  peur: "😨",
  fatigue: "😴",
  neutre: "😐",
};

const TYPE_ICON: Record<string, typeof Sparkles> = {
  health: TriangleAlert,
  anxiety: Activity,
  trend: TrendingUp,
  emotion: Heart,
  positive: Sparkles,
};

const TONE_STYLE: Record<
  InsightTone,
  { card: string; icon: string }
> = {
  warning: {
    card: "border-amber-300/60 bg-amber-50/60 dark:bg-amber-950/20",
    icon: "bg-amber-100 text-amber-700 dark:bg-amber-900/40",
  },
  positive: {
    card: "border-emerald-300/60 bg-emerald-50/60 dark:bg-emerald-950/20",
    icon: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40",
  },
  neutral: {
    card: "border-border/60 bg-card",
    icon: "bg-primary/10 text-primary",
  },
};

function monthLabel(key: string) {
  const [, m] = key.split("-");
  return MONTHS_FR[Number(m) - 1] ?? key;
}

export function InsightsView() {
  const [data, setData] = useState<InsightsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [pet, setPet] = useState<string>("all");

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        setData(await fetchInsights(pet === "all" ? undefined : pet));
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erreur de chargement");
      } finally {
        setLoading(false);
      }
    })();
  }, [pet]);

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
        <Loader2 className="size-6 animate-spin" />
        <span className="text-sm">Analyse en cours…</span>
      </div>
    );
  }

  if (!data || data.total === 0) {
    return (
      <Card className="rounded-3xl p-12 text-center border-border/60 shadow-soft">
        <div className="size-16 rounded-2xl bg-primary/10 grid place-items-center mx-auto mb-4">
          <Lightbulb className="size-8 text-primary" />
        </div>
        <h3 className="font-semibold text-lg">Pas encore d&apos;insights</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Lance quelques analyses pour faire émerger des tendances.
        </p>
      </Card>
    );
  }

  const maxMonthly = Math.max(...data.monthly_counts.map((m) => m.count), 1);
  const emotionEntries = Object.entries(data.emotion_distribution).sort(
    ([, a], [, b]) => b - a,
  );
  const maxEmotion = Math.max(...emotionEntries.map(([, v]) => v), 1);
  const TrendIcon =
    data.trend_pct != null && data.trend_pct < 0 ? TrendingDown : TrendingUp;

  return (
    <div className="space-y-6">
      {data.pet_names.length > 0 && (
        <div className="glass shadow-soft rounded-2xl p-3 w-fit">
          <Select value={pet} onValueChange={setPet}>
            <SelectTrigger className="rounded-xl sm:w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les animaux</SelectItem>
              {data.pet_names.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {data.highlights.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {data.highlights.map((h, i) => {
            const Icon = TYPE_ICON[h.type] ?? Sparkles;
            const tone = TONE_STYLE[h.tone];
            return (
              <Card
                key={i}
                className={cn(
                  "rounded-2xl border shadow-soft p-4 flex gap-3 items-start",
                  tone.card,
                )}
              >
                <div
                  className={cn(
                    "size-9 rounded-xl grid place-items-center shrink-0",
                    tone.icon,
                  )}
                >
                  <Icon className="size-5" />
                </div>
                <p className="text-sm leading-relaxed">{h.text}</p>
              </Card>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard label="Analyses (total)" value={String(data.total)} />
        <KpiCard label="Ce mois-ci" value={String(data.this_month)} />
        <KpiCard
          label="vs mois dernier"
          value={
            data.trend_pct == null
              ? "—"
              : `${data.trend_pct > 0 ? "+" : ""}${data.trend_pct} %`
          }
          icon={data.trend_pct == null ? undefined : TrendIcon}
        />
      </div>

      <Card className="rounded-3xl border-border/60 shadow-soft p-6">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-5">
          Analyses des 6 derniers mois
        </h3>
        <div className="flex items-end justify-between gap-2 h-40">
          {data.monthly_counts.map((m) => (
            <div
              key={m.month}
              className="flex-1 flex flex-col items-center gap-2 h-full justify-end"
            >
              <span className="text-xs font-medium tabular-nums text-muted-foreground">
                {m.count}
              </span>
              <div
                className="w-full rounded-t-lg bg-gradient-to-t from-primary/70 to-primary transition-all"
                style={{
                  height: `${(m.count / maxMonthly) * 100}%`,
                  minHeight: m.count > 0 ? "6px" : "2px",
                }}
              />
              <span className="text-xs text-muted-foreground">
                {monthLabel(m.month)}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {emotionEntries.length > 0 && (
        <Card className="rounded-3xl border-border/60 shadow-soft p-6">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-5">
            États détectés
          </h3>
          <div className="space-y-3">
            {emotionEntries.map(([emotion, count]) => (
              <div key={emotion}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="font-medium capitalize">
                    {EMOTION_EMOJI[emotion] || "🐾"} {emotion.replace("_", " ")}
                  </span>
                  <span className="text-muted-foreground tabular-nums">
                    {count}
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${(count / maxEmotion) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function KpiCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: typeof TrendingUp;
}) {
  return (
    <Card className="rounded-3xl border-border/60 shadow-soft p-5">
      <div className="flex items-center gap-2">
        <span className="text-3xl font-bold tabular-nums">{value}</span>
        {Icon && <Icon className="size-5 text-primary" />}
      </div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </Card>
  );
}

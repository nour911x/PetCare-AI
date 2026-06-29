"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Sparkles,
  Dog,
  Cat,
  Camera,
  Loader2,
  BarChart3,
  Heart,
  Stethoscope,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { fetchStats } from "@/lib/api";
import type { StatsResponse } from "@/types/api";

const EMOTION_COLORS: Record<string, string> = {
  heureux: "#22c55e",
  calme: "#06b6d4",
  joueur: "#a855f7",
  stresse: "#f59e0b",
  anxieux: "#fb923c",
  en_colere: "#dc2626",
  triste: "#6366f1",
  peur: "#7c3aed",
  fatigue: "#64748b",
  neutre: "#94a3b8",
};

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

const URGENCY_ORDER = ["vert", "jaune", "orange", "rouge"];
const URGENCY_COLORS: Record<string, string> = {
  vert: "#22c55e",
  jaune: "#eab308",
  orange: "#f97316",
  rouge: "#dc2626",
};
const URGENCY_LABEL: Record<string, string> = {
  vert: "RAS",
  jaune: "Surveiller",
  orange: "Consulter",
  rouge: "Urgence",
};

export function StatsDashboard() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const data = await fetchStats();
        setStats(data);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erreur de chargement");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
        <Loader2 className="size-6 animate-spin" />
        <span className="text-sm">Chargement…</span>
      </div>
    );
  }

  if (!stats || stats.total === 0) {
    return (
      <Card className="rounded-3xl p-12 text-center border-border/60 shadow-soft">
        <div className="size-16 rounded-2xl bg-primary/10 grid place-items-center mx-auto mb-4">
          <BarChart3 className="size-8 text-primary" />
        </div>
        <h3 className="font-semibold text-lg">Pas encore de données</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Lance quelques analyses pour faire apparaître les statistiques.
        </p>
      </Card>
    );
  }

  const emotionEntries = Object.entries(stats.emotion_distribution).sort(
    ([, a], [, b]) => b - a,
  );
  const urgencyEntries = URGENCY_ORDER.map((u) => [
    u,
    stats.urgency_distribution[u] || 0,
  ]) as [string, number][];

  const totalUrgency = urgencyEntries.reduce((s, [, v]) => s + v, 0);
  const totalEmotion = emotionEntries.reduce((s, [, v]) => s + v, 0);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={Sparkles}
          label="Total analyses"
          value={stats.total}
          tint="var(--primary)"
        />
        <KpiCard
          icon={Dog}
          label="Chiens"
          value={stats.chiens}
          tint="#d97706"
        />
        <KpiCard
          icon={Cat}
          label="Chats"
          value={stats.chats}
          tint="#9333ea"
        />
        <KpiCard
          icon={Camera}
          label="Avec médias"
          value={stats.with_photos}
          tint="#db2777"
        />
      </div>

      {/* Niveaux d'urgence */}
      {totalUrgency > 0 && (
        <Card className="rounded-3xl border-border/60 shadow-soft lift">
          <div className="p-6">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="size-8 rounded-xl bg-primary/10 grid place-items-center">
                <Stethoscope className="size-4 text-primary" />
              </div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Niveaux d&apos;urgence détectés
              </h3>
            </div>
            <div className="space-y-3">
              {urgencyEntries.map(([key, value]) => {
                const pct = totalUrgency > 0 ? (value / totalUrgency) * 100 : 0;
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="font-medium">{URGENCY_LABEL[key]}</span>
                      <span className="text-muted-foreground tabular-nums">
                        {value}{" "}
                        <span className="text-xs">
                          ({pct.toFixed(0)}%)
                        </span>
                      </span>
                    </div>
                    <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          background: URGENCY_COLORS[key],
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {/* Distribution émotions */}
      {totalEmotion > 0 && (
        <Card className="rounded-3xl border-border/60 shadow-soft lift">
          <div className="p-6">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="size-8 rounded-xl bg-primary/10 grid place-items-center">
                <Heart className="size-4 text-primary" />
              </div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Distribution des émotions
              </h3>
            </div>
            <div className="space-y-3">
              {emotionEntries.map(([key, value]) => {
                const pct = (value / totalEmotion) * 100;
                const color = EMOTION_COLORS[key] || "#94a3b8";
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="font-medium capitalize">
                        {EMOTION_EMOJI[key] || "🐾"}{" "}
                        {key.replace("_", " ")}
                      </span>
                      <span className="text-muted-foreground tabular-nums">
                        {value}{" "}
                        <span className="text-xs">
                          ({pct.toFixed(0)}%)
                        </span>
                      </span>
                    </div>
                    <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, background: color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  tint,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  value: number;
  tint: string;
}) {
  return (
    <Card className="rounded-3xl border-border/60 shadow-soft lift p-5">
      <div
        className="size-11 rounded-2xl grid place-items-center"
        style={{ background: `color-mix(in oklch, ${tint} 15%, transparent)` }}
      >
        <Icon className="size-5" style={{ color: tint }} />
      </div>
      <div className="mt-3 text-3xl font-bold tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
    </Card>
  );
}

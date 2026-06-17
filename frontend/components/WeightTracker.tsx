"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Weight,
  TrendingUp,
  TrendingDown,
  Minus,
  TriangleAlert,
  Plus,
  Trash2,
  Loader2,
  X,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

import { fetchWeights, addWeight, deleteWeight } from "@/lib/api";
import type { Pet, WeightDirection, WeightHistory } from "@/types/api";

const DIRECTION_META: Record<
  WeightDirection,
  { label: string; icon: typeof TrendingUp; className: string }
> = {
  hausse: { label: "En hausse", icon: TrendingUp, className: "text-amber-600" },
  baisse: { label: "En baisse", icon: TrendingDown, className: "text-sky-600" },
  stable: { label: "Stable", icon: Minus, className: "text-emerald-600" },
  insuffisant: {
    label: "Pas assez de données",
    icon: Minus,
    className: "text-muted-foreground",
  },
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function WeightTracker({
  pet,
  onClose,
}: {
  pet: Pet;
  onClose: () => void;
}) {
  const [data, setData] = useState<WeightHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [weight, setWeight] = useState("");
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      setData(await fetchWeights(pet.id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pet.id]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const value = Number(weight);
    if (!value || value <= 0) {
      toast.error("Saisis un poids valide.");
      return;
    }
    setSaving(true);
    try {
      await addWeight(pet.id, {
        weight_kg: value,
        date: date || null,
        note: note.trim() || null,
      });
      setWeight("");
      setNote("");
      setDate(todayISO());
      toast.success("Pesée ajoutée");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur d'ajout");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(entryId: number) {
    try {
      await deleteWeight(pet.id, entryId);
      toast.success("Pesée supprimée");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur de suppression");
    }
  }

  const insights = data?.insights;
  const dir = insights ? DIRECTION_META[insights.direction] : null;
  const DirIcon = dir?.icon;

  return (
    <Card className="p-6 sm:p-8 rounded-3xl glass shadow-soft-lg fade-up">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-2xl bg-primary/10 grid place-items-center">
            <Weight className="size-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Suivi du poids</h2>
            <p className="text-sm text-muted-foreground">{pet.name}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label="Fermer"
        >
          <X className="size-4" />
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
          <Loader2 className="size-6 animate-spin" />
          <span className="text-sm">Chargement…</span>
        </div>
      ) : (
        <div className="space-y-6">
          {insights && insights.count > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Stat label="Poids actuel" value={`${insights.latest_kg} kg`} />
              <Stat
                label="Évolution totale"
                value={
                  insights.change_kg == null
                    ? "—"
                    : `${insights.change_kg > 0 ? "+" : ""}${insights.change_kg} kg`
                }
                sub={
                  insights.change_pct == null
                    ? undefined
                    : `${insights.change_pct > 0 ? "+" : ""}${insights.change_pct} %`
                }
              />
              {dir && DirIcon && (
                <div className="rounded-2xl bg-muted/50 border border-border/50 p-3 flex flex-col justify-center">
                  <div
                    className={`flex items-center gap-1.5 font-semibold ${dir.className}`}
                  >
                    <DirIcon className="size-4" />
                    {dir.label}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Tendance
                  </div>
                </div>
              )}
            </div>
          )}

          {insights && insights.anomalies.length > 0 && (
            <Alert variant="destructive" className="rounded-2xl">
              <TriangleAlert />
              <AlertTitle>Variations à surveiller</AlertTitle>
              <AlertDescription>
                <ul className="list-disc pl-4 space-y-0.5">
                  {insights.anomalies.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
                <p className="mt-1 text-xs">
                  Une variation rapide de poids peut justifier un avis
                  vétérinaire.
                </p>
              </AlertDescription>
            </Alert>
          )}

          {data && data.entries.length >= 2 ? (
            <WeightChart entries={data.entries} />
          ) : (
            <p className="text-sm text-muted-foreground">
              Ajoute au moins deux pesées pour visualiser la courbe.
            </p>
          )}

          <form
            onSubmit={handleAdd}
            className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_2fr_auto] gap-3 items-end border-t border-border/60 pt-5"
          >
            <div className="space-y-1.5">
              <Label htmlFor="w-date">Date</Label>
              <Input
                id="w-date"
                type="date"
                value={date}
                max={todayISO()}
                onChange={(e) => setDate(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="w-kg">Poids (kg)</Label>
              <Input
                id="w-kg"
                type="number"
                step="0.1"
                min="0"
                placeholder="12.5"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="w-note">Note (optionnel)</Label>
              <Input
                id="w-note"
                placeholder="Ex : après régime"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <Button type="submit" disabled={saving} className="rounded-xl">
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              Ajouter
            </Button>
          </form>

          {data && data.entries.length > 0 && (
            <div className="space-y-2">
              {[...data.entries].reverse().map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center gap-3 rounded-xl bg-muted/40 border border-border/50 px-4 py-2.5"
                >
                  <span className="font-semibold tabular-nums w-20">
                    {entry.weight_kg} kg
                  </span>
                  <span className="text-sm text-muted-foreground w-28">
                    {formatDate(entry.date)}
                  </span>
                  {entry.note && (
                    <span className="text-sm text-muted-foreground flex-1 truncate">
                      {entry.note}
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(entry.id)}
                    className="ml-auto text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                    aria-label="Supprimer la pesée"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl bg-muted/50 border border-border/50 p-3">
      <div className="text-2xl font-bold tabular-nums">{value}</div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}

function WeightChart({
  entries,
}: {
  entries: { date: string; weight_kg: number }[];
}) {
  const W = 600;
  const H = 220;
  const pad = 32;

  const { points, minY, maxY } = useMemo(() => {
    const weights = entries.map((e) => e.weight_kg);
    let lo = Math.min(...weights);
    let hi = Math.max(...weights);
    if (lo === hi) {
      lo -= 1;
      hi += 1;
    }
    const span = hi - lo;
    const n = entries.length;
    const pts = entries.map((e, i) => {
      const x = pad + (i * (W - 2 * pad)) / (n - 1);
      const y = H - pad - ((e.weight_kg - lo) / span) * (H - 2 * pad);
      return { x, y, ...e };
    });
    return { points: pts, minY: lo, maxY: hi };
  }, [entries]);

  const linePath = points.map((p) => `${p.x},${p.y}`).join(" ");
  const areaPath = `${pad},${H - pad} ${linePath} ${W - pad},${H - pad}`;

  return (
    <div className="rounded-2xl border border-border/50 bg-card/60 p-4">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        <defs>
          <linearGradient id="weightFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>

        <text x={4} y={pad} className="fill-muted-foreground" fontSize="12">
          {maxY.toFixed(1)}
        </text>
        <text
          x={4}
          y={H - pad + 4}
          className="fill-muted-foreground"
          fontSize="12"
        >
          {minY.toFixed(1)}
        </text>

        <polygon points={areaPath} fill="url(#weightFill)" />
        <polyline
          points={linePath}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="3.5"
            fill="var(--background)"
            stroke="var(--primary)"
            strokeWidth="2"
          />
        ))}
      </svg>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Sparkles, PawPrint, Dna } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { BREEDS } from "@/lib/breeds";
import { fetchBenchmarks, fetchPets } from "@/lib/api";
import type { BreedBenchmark, Species } from "@/types/api";

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

export function BenchmarksView() {
  const [species, setSpecies] = useState<Species>("chien");
  const [breed, setBreed] = useState<string>(BREEDS.chien[0]);
  const [data, setData] = useState<BreedBenchmark | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const pets = await fetchPets();
        const withBreed = pets.find(
          (p) => p.breed && BREEDS[p.species].includes(p.breed),
        );
        if (withBreed && withBreed.breed) {
          setSpecies(withBreed.species);
          setBreed(withBreed.breed);
        }
      } catch {
      }
    })();
  }, []);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        setData(await fetchBenchmarks(breed, species));
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erreur de chargement");
      } finally {
        setLoading(false);
      }
    })();
  }, [breed, species]);

  const emotionEntries = data
    ? Object.entries(data.emotion_percentages).sort(([, a], [, b]) => b - a)
    : [];

  return (
    <div className="space-y-6">
      <div className="glass shadow-soft rounded-2xl p-3 flex flex-col sm:flex-row gap-3">
        <div className="grid grid-cols-2 gap-2 sm:w-56">
          {(["chien", "chat"] as Species[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setSpecies(s);
                setBreed(BREEDS[s][0]);
              }}
              className={cn(
                "rounded-xl border-2 py-2 text-sm font-medium capitalize transition",
                species === s
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/40",
              )}
            >
              {s === "chien" ? "🐕" : "🐈"} {s}
            </button>
          ))}
        </div>
        <Select value={breed} onValueChange={setBreed}>
          <SelectTrigger className="rounded-xl sm:w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {BREEDS[species].map((b) => (
              <SelectItem key={b} value={b}>
                {b}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading || !data ? (
        <div className="flex justify-center py-16 text-muted-foreground">
          <Loader2 className="size-6 animate-spin" />
        </div>
      ) : (
        <>
          {data.highlights.map((h, i) => (
            <Card
              key={i}
              className="rounded-2xl border-primary/30 bg-primary/5 shadow-soft p-4 flex gap-3 items-start"
            >
              <div className="size-9 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0">
                <Sparkles className="size-5" />
              </div>
              <p className="text-sm leading-relaxed">{h}</p>
            </Card>
          ))}

          <Card className="rounded-3xl border-border/60 shadow-soft p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4 flex items-center gap-2">
              <Dna className="size-4" />
              Tempérament typique : {breed}
            </h3>
            <ul className="space-y-2">
              {data.typical_traits.map((t, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm">
                  <PawPrint className="size-4 text-primary shrink-0 mt-0.5" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="rounded-3xl border-border/60 shadow-soft p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                États observés chez les {breed}
              </h3>
              <Badge variant="secondary" className="font-normal">
                {data.sample_size} analyse{data.sample_size > 1 ? "s" : ""}
              </Badge>
            </div>
            {emotionEntries.length > 0 ? (
              <div className="space-y-3">
                {emotionEntries.map(([emotion, pct]) => (
                  <div key={emotion}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="font-medium capitalize">
                        {EMOTION_EMOJI[emotion] || "🐾"}{" "}
                        {emotion.replace("_", " ")}
                      </span>
                      <span className="text-muted-foreground tabular-nums">
                        {pct} %
                      </span>
                    </div>
                    <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Aucune analyse de {breed} pour l&apos;instant. Les statistiques
                s&apos;enrichiront au fil de tes analyses.
              </p>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

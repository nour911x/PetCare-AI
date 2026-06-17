"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Loader2,
  PawPrint,
  Circle,
  CircleCheck,
  CalendarPlus,
  Lightbulb,
  Sparkles,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { fetchPets, fetchOnboarding, createReminder } from "@/lib/api";
import type {
  Pet,
  OnboardingPlan,
  OnboardingStep,
  ReminderCategory,
} from "@/types/api";

const CATEGORY_LABEL: Record<string, string> = {
  chiot: "Parcours chiot",
  chaton: "Parcours chaton",
  adulte: "Parcours adulte",
  senior: "Parcours senior",
};

function storageKey(petId: number) {
  return `petcare:onboarding:${petId}`;
}

function loadDone(petId: number): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey(petId));
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function saveDone(petId: number, ids: string[]) {
  try {
    window.localStorage.setItem(storageKey(petId), JSON.stringify(ids));
  } catch {
  }
}

function inSevenDays() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
}

export function OnboardingGuide() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [petId, setPetId] = useState<string>("");
  const [plan, setPlan] = useState<OnboardingPlan | null>(null);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [loadingPets, setLoadingPets] = useState(true);
  const [loadingPlan, setLoadingPlan] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const p = await fetchPets();
        setPets(p);
        if (p.length > 0) setPetId(String(p[0].id));
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erreur de chargement");
      } finally {
        setLoadingPets(false);
      }
    })();
  }, []);

  const selectedPet = pets.find((p) => String(p.id) === petId);

  useEffect(() => {
    if (!selectedPet) return;
    setDone(new Set(loadDone(selectedPet.id)));
    void (async () => {
      setLoadingPlan(true);
      try {
        const ageMonths =
          selectedPet.age_years != null
            ? Math.round(selectedPet.age_years * 12)
            : null;
        setPlan(
          await fetchOnboarding({
            species: selectedPet.species,
            ageMonths,
            breed: selectedPet.breed,
          }),
        );
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erreur de chargement");
      } finally {
        setLoadingPlan(false);
      }
    })();
  }, [selectedPet]);

  const toggle = useCallback(
    (stepId: string) => {
      if (!selectedPet) return;
      setDone((curr) => {
        const next = new Set(curr);
        if (next.has(stepId)) next.delete(stepId);
        else next.add(stepId);
        saveDone(selectedPet.id, [...next]);
        return next;
      });
    },
    [selectedPet],
  );

  async function addReminder(step: OnboardingStep) {
    if (!selectedPet || !step.category) return;
    try {
      await createReminder({
        pet_id: selectedPet.id,
        title: step.text.replace(/\.$/, ""),
        category: step.category as ReminderCategory,
        due_date: inSevenDays(),
        notes: `Ajouté depuis le guide de ${selectedPet.name}`,
      });
      toast.success("Rappel ajouté (échéance dans 7 jours)");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  }

  if (loadingPets) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
        <Loader2 className="size-6 animate-spin" />
        <span className="text-sm">Chargement…</span>
      </div>
    );
  }

  if (pets.length === 0) {
    return (
      <Card className="rounded-3xl p-12 text-center border-border/60 shadow-soft">
        <div className="size-16 rounded-2xl bg-primary/10 grid place-items-center mx-auto mb-4">
          <PawPrint className="size-8 text-primary" />
        </div>
        <h3 className="font-semibold text-lg">Crée d&apos;abord une fiche animal</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Le guide s&apos;adapte à l&apos;espèce, l&apos;âge et la race de ton
          animal. Va dans « Mes animaux » pour en ajouter un.
        </p>
      </Card>
    );
  }

  const totalSteps =
    plan?.phases.reduce((sum, ph) => sum + ph.steps.length, 0) ?? 0;
  const doneCount =
    plan?.phases.reduce(
      (sum, ph) => sum + ph.steps.filter((s) => done.has(s.id)).length,
      0,
    ) ?? 0;
  const progress = totalSteps > 0 ? Math.round((doneCount / totalSteps) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="glass shadow-soft rounded-2xl p-3 w-fit">
        <Select value={petId} onValueChange={setPetId}>
          <SelectTrigger className="rounded-xl sm:w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pets.map((p) => (
              <SelectItem key={p.id} value={String(p.id)}>
                {p.species === "chien" ? "🐕" : "🐈"} {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loadingPlan || !plan ? (
        <div className="flex justify-center py-16 text-muted-foreground">
          <Loader2 className="size-6 animate-spin" />
        </div>
      ) : (
        <>
          <Card className="rounded-3xl border-border/60 shadow-soft p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="font-normal">
                  {CATEGORY_LABEL[plan.age_category] ?? "Parcours"}
                </Badge>
                {selectedPet?.breed && (
                  <span className="text-sm text-muted-foreground">
                    {selectedPet.breed}
                  </span>
                )}
              </div>
              <span className="text-sm font-semibold tabular-nums">
                {doneCount}/{totalSteps} · {progress}%
              </span>
            </div>
            <div className="h-2.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            {progress === 100 && (
              <p className="mt-3 text-sm text-emerald-600 flex items-center gap-1.5">
                <Sparkles className="size-4" />
                Bravo, tu as terminé le guide de {selectedPet?.name} !
              </p>
            )}
          </Card>

          {plan.breed_tips.length > 0 && (
            <Card className="rounded-2xl border-amber-300/60 bg-amber-50/60 dark:bg-amber-950/20 shadow-soft p-4">
              <div className="flex gap-3">
                <div className="size-9 rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/40 grid place-items-center shrink-0">
                  <Lightbulb className="size-5" />
                </div>
                <div>
                  <div className="font-medium text-sm">
                    Spécial {selectedPet?.breed}
                  </div>
                  <ul className="mt-1 text-sm text-muted-foreground list-disc pl-4 space-y-0.5">
                    {plan.breed_tips.map((tip, i) => (
                      <li key={i}>{tip}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          )}

          <div className="space-y-4">
            {plan.phases.map((phase) => (
              <Card
                key={phase.id}
                className="rounded-3xl border-border/60 shadow-soft p-5 sm:p-6"
              >
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <span className="text-xl">{phase.emoji}</span>
                  {phase.title}
                </h3>
                <ul className="space-y-2.5">
                  {phase.steps.map((step) => {
                    const checked = done.has(step.id);
                    return (
                      <li key={step.id} className="flex items-start gap-3">
                        <button
                          type="button"
                          onClick={() => toggle(step.id)}
                          aria-label={checked ? "Décocher" : "Cocher"}
                          className="shrink-0 mt-0.5 text-muted-foreground hover:text-primary transition"
                        >
                          {checked ? (
                            <CircleCheck className="size-5 text-emerald-600" />
                          ) : (
                            <Circle className="size-5" />
                          )}
                        </button>
                        <span
                          className={cn(
                            "text-sm flex-1",
                            checked && "line-through text-muted-foreground",
                          )}
                        >
                          {step.text}
                        </span>
                        {step.category && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => addReminder(step)}
                            className="shrink-0 -my-1"
                          >
                            <CalendarPlus className="size-4" />
                            Rappel
                          </Button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

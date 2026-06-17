"use client";

import { useState } from "react";
import {
  Wind,
  Droplet,
  Zap,
  Pill,
  Bone,
  Activity,
  Eye,
  TriangleAlert,
  MapPin,
  RotateCcw,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Level = "rouge" | "orange" | "jaune" | "vert";

interface Option {
  id: string;
  label: string;
  icon: typeof Wind;
  weight: number;
  redFlag?: boolean;
}

const SYMPTOMS: Option[] = [
  { id: "respiration", label: "Difficulté à respirer", icon: Wind, weight: 0, redFlag: true },
  { id: "convulsion", label: "Convulsions / perte de connaissance", icon: Zap, weight: 0, redFlag: true },
  { id: "saignement", label: "Saignement abondant", icon: Droplet, weight: 0, redFlag: true },
  { id: "toxique", label: "A avalé un produit toxique", icon: Pill, weight: 0, redFlag: true },
  { id: "ventre", label: "Ventre gonflé / vomit sans rien sortir", icon: TriangleAlert, weight: 0, redFlag: true },
  { id: "digestif", label: "Vomissements ou diarrhée", icon: Activity, weight: 2 },
  { id: "blessure", label: "Boiterie ou blessure", icon: Bone, weight: 2 },
  { id: "abattu", label: "Ne mange pas / abattu", icon: Activity, weight: 2 },
  { id: "oeil", label: "Œil ou peau irrité", icon: Eye, weight: 1 },
];

const TIMINGS: Option[] = [
  { id: "soudain", label: "Très soudain (quelques heures)", icon: Zap, weight: 2 },
  { id: "aujourdhui", label: "Depuis aujourd'hui", icon: Activity, weight: 1 },
  { id: "jours", label: "Depuis plusieurs jours", icon: Activity, weight: 1 },
];

const STATES: Option[] = [
  { id: "normal", label: "Éveillé et réactif", icon: Activity, weight: 0 },
  { id: "fatigue", label: "Très fatigué / abattu", icon: Activity, weight: 2 },
  { id: "inconscient", label: "Ne réagit presque plus", icon: TriangleAlert, weight: 0, redFlag: true },
];

const STEPS = [
  { key: "symptom", title: "Quel est le problème principal ?", options: SYMPTOMS },
  { key: "timing", title: "Depuis combien de temps ?", options: TIMINGS },
  { key: "state", title: "Comment est son état général ?", options: STATES },
];

const LEVELS: Record<
  Level,
  { label: string; color: string; emoji: string; advice: string }
> = {
  rouge: {
    label: "Urgence vétérinaire",
    color: "#dc2626",
    emoji: "🚨",
    advice:
      "Contacte immédiatement un vétérinaire ou une clinique d'urgence. N'attends pas.",
  },
  orange: {
    label: "Consulte rapidement",
    color: "#f97316",
    emoji: "🟠",
    advice:
      "Prends rendez-vous avec ton vétérinaire dans les 24 h et surveille de près.",
  },
  jaune: {
    label: "À surveiller",
    color: "#eab308",
    emoji: "🟡",
    advice:
      "Surveille l'évolution sur 24–48 h. Consulte si ça s'aggrave ou ne s'améliore pas.",
  },
  vert: {
    label: "Pas d'urgence apparente",
    color: "#22c55e",
    emoji: "🟢",
    advice:
      "Aucun signe d'urgence détecté. Continue de surveiller le comportement de ton animal.",
  },
};

function computeLevel(symptom: Option, timing: Option, state: Option): Level {
  if (symptom.redFlag || state.redFlag) return "rouge";
  const score = symptom.weight + timing.weight + state.weight;
  if (score >= 5) return "orange";
  if (score >= 3) return "jaune";
  return "vert";
}

function openNearbyVets(level: Level) {
  const query =
    level === "rouge" || level === "orange"
      ? "vétérinaire urgence de garde"
      : "vétérinaire";
  window.open(
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`,
    "_blank",
    "noopener,noreferrer",
  );
}

export function EmergencyTriage() {
  const [answers, setAnswers] = useState<Option[]>([]);
  const step = answers.length;

  function choose(option: Option) {
    setAnswers((curr) => [...curr, option]);
  }

  function back() {
    setAnswers((curr) => curr.slice(0, -1));
  }

  function restart() {
    setAnswers([]);
  }

  if (step >= STEPS.length) {
    const level = computeLevel(answers[0], answers[1], answers[2]);
    const meta = LEVELS[level];
    const isCritical = level === "rouge" || level === "orange";

    return (
      <div className="space-y-5">
        <Card
          className="rounded-3xl border-2 shadow-soft-lg p-7 sm:p-8 fade-up"
          style={{
            borderColor: meta.color,
            background: `color-mix(in oklch, ${meta.color} 8%, var(--card))`,
          }}
        >
          <div className="flex items-center gap-4">
            <div className="text-5xl">{meta.emoji}</div>
            <div>
              <div
                className="text-2xl font-bold"
                style={{ color: meta.color }}
              >
                {meta.label}
              </div>
              <p className="mt-1 text-sm sm:text-base text-foreground/80">
                {meta.advice}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Button
              size="lg"
              onClick={() => openNearbyVets(level)}
              className="rounded-2xl text-base flex-1"
              style={{ background: meta.color }}
            >
              <MapPin className="size-4" />
              Trouver un vétérinaire proche
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={restart}
              className="rounded-2xl"
            >
              <RotateCcw className="size-4" />
              Recommencer
            </Button>
          </div>
        </Card>

        {isCritical && (
          <Card className="rounded-2xl border-border/60 shadow-soft p-5">
            <div className="flex gap-3">
              <TriangleAlert className="size-5 text-destructive shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <strong className="text-foreground">Important :</strong> ce
                triage est indicatif et ne remplace pas l&apos;avis d&apos;un
                vétérinaire. En cas de doute, appelle toujours une clinique.
              </div>
            </div>
          </Card>
        )}

        <div className="flex flex-wrap gap-2">
          {answers.map((a, i) => (
            <span
              key={i}
              className="text-xs rounded-full bg-muted px-3 py-1 text-muted-foreground"
            >
              {a.label}
            </span>
          ))}
        </div>
      </div>
    );
  }

  const current = STEPS[step];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div
            key={s.key}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              i <= step ? "bg-primary" : "bg-muted",
            )}
          />
        ))}
      </div>

      <Card className="rounded-3xl glass shadow-soft-lg p-6 sm:p-8 fade-up">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg sm:text-xl font-semibold">{current.title}</h2>
          <span className="text-xs text-muted-foreground shrink-0">
            Étape {step + 1} / {STEPS.length}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {current.options.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => choose(option)}
                className={cn(
                  "group/opt flex items-center gap-3 rounded-2xl border-2 p-4 text-left transition-all hover:-translate-y-0.5",
                  option.redFlag
                    ? "border-destructive/30 bg-destructive/5 hover:border-destructive"
                    : "border-border hover:border-primary/50 hover:bg-muted/40",
                )}
              >
                <div
                  className={cn(
                    "size-10 rounded-xl grid place-items-center shrink-0",
                    option.redFlag
                      ? "bg-destructive/10 text-destructive"
                      : "bg-primary/10 text-primary",
                  )}
                >
                  <Icon className="size-5" />
                </div>
                <span className="font-medium flex-1">{option.label}</span>
                <ChevronRight className="size-4 text-muted-foreground opacity-0 group-hover/opt:opacity-100 transition" />
              </button>
            );
          })}
        </div>

        {step > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={back}
            className="mt-5"
          >
            <ArrowLeft className="size-4" />
            Question précédente
          </Button>
        )}
      </Card>
    </div>
  );
}

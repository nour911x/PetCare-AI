import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Stethoscope, Clock, AlertOctagon } from "lucide-react";
import type { HealthData } from "@/types/api";

interface Props {
  health: HealthData;
}

const FALLBACK_COLOR = "#94a3b8";

export function HealthCard({ health }: Props) {
  const color = health.color || FALLBACK_COLOR;
  const emoji = health.emoji || "⚪";
  const urgencyLabel = health.urgency_label || health.urgency;
  const recoLabel = health.recommendation_label || "";
  const confidence = Math.round(health.confidence * 100);
  const isEmergency = health.urgency === "rouge";

  return (
    <Card
      className="rounded-3xl overflow-hidden border-2 shadow-soft lift relative"
      style={{
        borderColor: `${color}40`,
        background: `linear-gradient(135deg, ${color}1a 0%, transparent 70%)`,
        boxShadow: isEmergency
          ? `0 0 0 1px ${color}, 0 8px 30px ${color}33`
          : undefined,
      }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{ background: color }}
      />

      <div className="p-6 sm:p-7">
        <div className="flex items-center gap-2 mb-5">
          <Stethoscope className="size-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Évaluation santé
          </h3>
        </div>

        <div className="flex items-start gap-5">
          <div
            className="size-20 rounded-2xl grid place-items-center shrink-0 text-4xl"
            style={{ background: `${color}26` }}
          >
            {emoji}
          </div>
          <div className="flex-1 min-w-0">
            <div
              className="text-2xl sm:text-3xl font-bold leading-tight"
              style={{ color }}
            >
              {urgencyLabel}
            </div>
            <p className="text-sm text-muted-foreground mt-1.5">{recoLabel}</p>
            <div className="mt-2">
              <Badge variant="outline" className="font-mono text-xs">
                {confidence}% confiance
              </Badge>
            </div>
          </div>
        </div>

        <div className="mt-5">
          <Progress value={confidence} className="h-1.5" />
        </div>

        {isEmergency && (
          <Alert variant="destructive" className="mt-5 rounded-xl">
            <AlertOctagon className="size-4" />
            <AlertTitle>Action immédiate recommandée</AlertTitle>
            <AlertDescription>
              Cette situation nécessite une consultation vétérinaire
              <strong> immédiate</strong>. Si tu n&apos;as pas accès à ton
              vétérinaire habituel, appelle une clinique vétérinaire
              d&apos;urgence (disponibles 24h/24).
            </AlertDescription>
          </Alert>
        )}

        <div className="mt-5 space-y-3">
          <p className="text-sm leading-relaxed">
            <span className="font-semibold">Analyse : </span>
            <span className="text-muted-foreground">{health.reasoning}</span>
          </p>

          {health.potential_concerns?.length > 0 && (
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Pistes médicales possibles
              </div>
              <div className="flex flex-wrap gap-1.5">
                {health.potential_concerns.map((c, i) => (
                  <Badge
                    key={i}
                    variant="secondary"
                    className="font-normal text-xs"
                  >
                    {c}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                ⚠️ Ce ne sont que des pistes — un diagnostic ne peut être posé
                que par un vétérinaire.
              </p>
            </div>
          )}

          {health.when_to_consult && (
            <div className="flex items-start gap-2 pt-2 border-t border-border">
              <Clock className="size-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-sm">
                <span className="font-semibold">Quand consulter : </span>
                <span className="text-muted-foreground">
                  {health.when_to_consult}
                </span>
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

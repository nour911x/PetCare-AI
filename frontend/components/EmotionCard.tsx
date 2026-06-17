import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Heart } from "lucide-react";
import type { EmotionData } from "@/types/api";

interface Props {
  emotion: EmotionData;
}

const FALLBACK_COLOR = "#94a3b8";

export function EmotionCard({ emotion }: Props) {
  const color = emotion.color || FALLBACK_COLOR;
  const emoji = emotion.emoji || "🐾";
  const name = emotion.emotion.replace("_", " ");
  const intensity = emotion.intensity;
  const confidence = Math.round(emotion.confidence * 100);

  return (
    <Card
      className="rounded-3xl overflow-hidden border-border/60 shadow-soft lift"
      style={{
        background: `linear-gradient(135deg, ${color}1a 0%, transparent 60%)`,
      }}
    >
      <div className="p-6 sm:p-7">
        <div className="flex items-center gap-2 mb-5">
          <Heart className="size-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            État émotionnel
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
              className="text-2xl sm:text-3xl font-bold capitalize leading-tight"
              style={{ color }}
            >
              {name}
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Badge variant="secondary" className="capitalize">
                Intensité : {intensity}
              </Badge>
              <Badge variant="outline" className="font-mono">
                {confidence}% confiance
              </Badge>
            </div>
          </div>
        </div>

        <div className="mt-5">
          <Progress value={confidence} className="h-1.5" />
        </div>

        <div className="mt-5 space-y-3">
          <p className="text-sm leading-relaxed">
            <span className="font-semibold">Pourquoi : </span>
            <span className="text-muted-foreground">{emotion.reasoning}</span>
          </p>

          {emotion.observed_signals?.length > 0 && (
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Signaux observés
              </div>
              <div className="flex flex-wrap gap-1.5">
                {emotion.observed_signals.map((sig, i) => (
                  <Badge
                    key={i}
                    variant="secondary"
                    className="font-normal text-xs"
                  >
                    {sig}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

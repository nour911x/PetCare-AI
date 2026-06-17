import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Film, Clock, Activity, MapPin, Target } from "lucide-react";
import type { VideoAnalysisData } from "@/types/api";

interface Props {
  video: VideoAnalysisData;
}

export function VideoMetricsCard({ video }: Props) {
  const metrics = [
    {
      icon: Clock,
      label: "Durée",
      value: `${video.duration_s.toFixed(1)}s`,
    },
    {
      icon: Target,
      label: "Détection",
      value: `${Math.round(video.detection_rate * 100)}%`,
    },
    {
      icon: Activity,
      label: "Activité",
      value: `${Math.round(video.activity_score * 100)}%`,
    },
    {
      icon: MapPin,
      label: "Déplacement",
      value: video.displacement.toFixed(2),
    },
  ];

  const labels = ["🟢 Début", "🟡 Milieu", "🔴 Fin"];

  return (
    <Card className="rounded-3xl overflow-hidden border-border/60 shadow-sm">
      <div className="p-6 sm:p-7">
        <div className="flex items-center gap-2 mb-5">
          <Film className="size-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Analyse vidéo · MediaPipe + Vision
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {metrics.map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.label}
                className="rounded-2xl bg-muted/40 border border-border/50 p-4"
              >
                <Icon className="size-4 text-muted-foreground mb-2" />
                <div className="text-2xl font-bold leading-tight tabular-nums">
                  {m.value}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {m.label}
                </div>
              </div>
            );
          })}
        </div>

        {video.key_frame_descriptions?.length > 0 && (
          <Accordion type="single" collapsible className="mt-5">
            <AccordionItem value="frames" className="border-b-0">
              <AccordionTrigger className="text-sm font-medium hover:no-underline rounded-xl px-4 bg-muted/40">
                Frames clés analysées
              </AccordionTrigger>
              <AccordionContent className="pt-3 space-y-3">
                {video.key_frame_descriptions.map((desc, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-border/60 p-4"
                  >
                    <div className="text-xs font-semibold mb-2">
                      {labels[i] || `Moment ${i + 1}`}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {desc}
                    </p>
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </div>
    </Card>
  );
}

import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { MessageCircle, Eye } from "lucide-react";

import { EmotionCard } from "@/components/EmotionCard";
import { HealthCard } from "@/components/HealthCard";
import { VideoMetricsCard } from "@/components/VideoMetricsCard";
import { SourcesAccordion } from "@/components/SourcesAccordion";
import type { AnalysisResponse } from "@/types/api";

interface Props {
  result: AnalysisResponse;
}

/**
 * Mini-rendu Markdown pour la réponse du LLM.
 * Gère paragraphes, sauts de ligne et **gras**.
 */
function MarkdownAnswer({ text }: { text: string }) {
  const paragraphs = text.split(/\n{2,}/);

  return (
    <div className="space-y-3 text-[15px] leading-relaxed">
      {paragraphs.map((para, i) => {
        const lines = para.split("\n");
        return (
          <p key={i}>
            {lines.map((line, j) => {
              const parts = line.split(/\*\*(.+?)\*\*/g);
              return (
                <span key={j}>
                  {parts.map((part, k) =>
                    k % 2 === 1 ? (
                      <strong key={k} className="font-semibold text-foreground">
                        {part}
                      </strong>
                    ) : (
                      <span key={k}>{part}</span>
                    ),
                  )}
                  {j < lines.length - 1 && <br />}
                </span>
              );
            })}
          </p>
        );
      })}
    </div>
  );
}

export function ResultDisplay({ result }: Props) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {result.health && <HealthCard health={result.health} />}
      {result.emotion && <EmotionCard emotion={result.emotion} />}
      {result.video_analysis && <VideoMetricsCard video={result.video_analysis} />}

      {result.image_description && (
        <Card className="rounded-3xl overflow-hidden border-border/60 shadow-soft lift">
          <Accordion type="single" collapsible>
            <AccordionItem value="vision" className="border-b-0">
              <AccordionTrigger className="px-6 sm:px-7 py-5 hover:no-underline">
                <div className="flex items-center gap-2 text-sm">
                  <Eye className="size-4 text-muted-foreground" />
                  <span className="uppercase tracking-wide font-semibold text-muted-foreground">
                    Ce que voit le module Vision
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 sm:px-7 pb-6">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {result.image_description}
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </Card>
      )}

      <Card className="rounded-3xl overflow-hidden border-border/60 shadow-soft lift">
        <div className="p-6 sm:p-7">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="size-8 rounded-xl bg-primary/10 grid place-items-center">
              <MessageCircle className="size-4 text-primary" />
            </div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Analyse comportementale
            </h3>
          </div>
          <MarkdownAnswer text={result.answer} />
        </div>
      </Card>

      <SourcesAccordion sources={result.sources} />
    </div>
  );
}

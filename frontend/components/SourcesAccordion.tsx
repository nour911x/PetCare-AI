import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { BookOpen } from "lucide-react";
import type { Source } from "@/types/api";

interface Props {
  sources: Source[];
}

export function SourcesAccordion({ sources }: Props) {
  if (!sources?.length) return null;

  return (
    <Card className="rounded-3xl overflow-hidden border-border/60 shadow-sm">
      <Accordion type="single" collapsible>
        <AccordionItem value="sources" className="border-b-0">
          <AccordionTrigger className="px-6 sm:px-7 py-5 hover:no-underline text-sm font-medium">
            <div className="flex items-center gap-2">
              <BookOpen className="size-4 text-muted-foreground" />
              <span className="uppercase tracking-wide text-muted-foreground">
                Sources utilisées
              </span>
              <span className="text-foreground font-semibold">
                ({sources.length})
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 sm:px-7 pb-6 space-y-3">
            {sources.map((src, i) => (
              <div
                key={i}
                className="rounded-2xl border border-border/60 bg-muted/30 p-4"
              >
                <div className="flex items-center gap-2 text-xs font-semibold mb-2">
                  <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    {src.species}
                  </span>
                  <span className="text-muted-foreground capitalize">
                    {src.topic?.replace(/_/g, " ")}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {src.excerpt}…
                </p>
              </div>
            ))}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}

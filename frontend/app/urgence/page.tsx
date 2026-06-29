import { TriangleAlert } from "lucide-react";
import { EmergencyTriage } from "@/components/EmergencyTriage";

export default function UrgencePage() {
  return (
    <div className="space-y-8">
      <header className="relative overflow-hidden rounded-[1.75rem] shadow-soft border border-destructive/30 bg-destructive/5 p-7 sm:p-8 fade-up">
        <div
          className="absolute -top-12 -right-8 size-48 rounded-full bg-destructive/15 blob"
          aria-hidden
        />
        <div className="relative flex items-center gap-4">
          <div className="size-12 rounded-2xl bg-destructive/10 grid place-items-center shrink-0">
            <TriangleAlert className="size-6 text-destructive" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-destructive">
              Mode urgence
            </h1>
            <p className="mt-1.5 text-foreground/70">
              Réponds à 3 questions pour évaluer la gravité et trouver un
              vétérinaire.
            </p>
          </div>
        </div>
      </header>

      <EmergencyTriage />
    </div>
  );
}

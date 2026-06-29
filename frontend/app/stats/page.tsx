import { BarChart3 } from "lucide-react";
import { StatsDashboard } from "@/components/StatsDashboard";

export default function StatsPage() {
  return (
    <div className="space-y-8">
      <header className="relative overflow-hidden rounded-[1.75rem] mesh-warm shadow-soft border border-border/50 p-7 sm:p-8 fade-up">
        <div
          className="absolute -top-12 -right-8 size-48 rounded-full bg-primary/20 blob"
          aria-hidden
        />
        <div className="relative flex items-center gap-4">
          <div className="size-12 rounded-2xl glass shadow-soft grid place-items-center shrink-0">
            <BarChart3 className="size-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              <span className="text-gradient">Statistiques</span>
            </h1>
            <p className="mt-1.5 text-muted-foreground">
              Vue d&apos;ensemble de l&apos;activité de l&apos;app.
            </p>
          </div>
        </div>
      </header>

      <StatsDashboard />
    </div>
  );
}

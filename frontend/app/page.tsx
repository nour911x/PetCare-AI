import Image from "next/image";
import Link from "next/link";
import { AnalysisForm } from "@/components/AnalysisForm";
import {
  Sparkles,
  ScanEye,
  HeartPulse,
  BookOpen,
  Dna,
  ArrowRight,
} from "lucide-react";

const FEATURES = [
  { icon: BookOpen, label: "Sources vétérinaires", tint: "var(--primary)" },
  { icon: ScanEye, label: "Vision & vidéo", tint: "var(--accent)" },
  { icon: HeartPulse, label: "Émotion & urgence", tint: "var(--chart-3)" },
];

export default function HomePage() {
  return (
    <div className="space-y-12">
      <section className="relative overflow-hidden rounded-[2rem] mesh-warm shadow-soft border border-border/50 fade-up">
        <div
          className="absolute -top-16 -left-10 size-64 rounded-full bg-primary/20 blob"
          aria-hidden
        />
        <div
          className="absolute -bottom-20 right-0 size-56 rounded-full bg-accent/25 blob"
          aria-hidden
        />

        <div className="relative grid gap-8 p-7 sm:p-10 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.05]">
              Comprends ton animal,{" "}
              <span className="text-gradient">en quelques secondes.</span>
            </h1>

            <p className="mt-4 max-w-xl text-base sm:text-lg text-muted-foreground leading-relaxed">
              Décris un comportement, envoie une photo ou une courte vidéo —
              PetCare&nbsp;AI combine sources vétérinaires, vision par ordinateur
              et détection émotionnelle pour t&apos;expliquer ce qui se passe.
            </p>

            <div className="mt-6 flex flex-wrap gap-2.5">
              {FEATURES.map(({ icon: Icon, label, tint }) => (
                <div
                  key={label}
                  className="inline-flex items-center gap-2 rounded-full bg-card/70 border border-border/60 px-3 py-1.5 text-xs font-medium shadow-soft"
                >
                  <Icon className="size-3.5" style={{ color: tint }} />
                  {label}
                </div>
              ))}
            </div>

            <Link
              href="/benchmarks"
              className="group/cta mt-6 inline-flex items-center gap-2.5 rounded-2xl bg-accent/15 border border-accent/30 px-4 py-2.5 text-sm font-medium shadow-soft hover:bg-accent/25 transition"
            >
              <Dna className="size-4 text-accent" />
              <span>
                <span className="font-semibold">Nouveau :</span> compare ton
                animal aux autres de sa race
              </span>
              <ArrowRight className="size-4 text-accent transition-transform group-hover/cta:translate-x-0.5" />
            </Link>
          </div>

          <div className="relative mx-auto hidden lg:block">
            <div className="relative size-52">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 blur-2xl" />
              <div className="relative size-52 rounded-[2.2rem] overflow-hidden shadow-soft-lg ring-1 ring-border/60 float">
                <Image
                  src="/mascotte.webp"
                  alt="Un chien et un chat blottis sous une couverture"
                  fill
                  priority
                  sizes="208px"
                  className="object-cover"
                />
              </div>
              <div className="absolute -bottom-4 -right-3 rounded-2xl glass shadow-soft px-3 py-2 float-slow">
                <Sparkles className="size-5 text-accent" />
              </div>
              <div className="absolute top-1/2 -right-6 rounded-full glass shadow-soft px-2.5 py-2 float">
                <HeartPulse className="size-4 text-primary" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <AnalysisForm />
    </div>
  );
}

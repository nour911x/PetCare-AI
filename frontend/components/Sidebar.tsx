"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sparkles,
  History,
  BarChart3,
  PawPrint,
  Bell,
  TriangleAlert,
  TrendingUp,
  GraduationCap,
  Dna,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  danger?: boolean;
  badge?: string;
};

const NAV: NavItem[] = [
  { href: "/", label: "Nouvelle analyse", icon: Sparkles },
  { href: "/pets", label: "Mes animaux", icon: PawPrint },
  { href: "/onboarding", label: "Bien démarrer", icon: GraduationCap, badge: "Nouveau" },
  { href: "/reminders", label: "Rappels", icon: Bell },
  { href: "/urgence", label: "Urgence", icon: TriangleAlert, danger: true },
  { href: "/insights", label: "Tendances", icon: TrendingUp },
  { href: "/benchmarks", label: "Par race", icon: Dna },
  { href: "/history", label: "Historique", icon: History },
  { href: "/stats", label: "Statistiques", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      <header className="no-print lg:hidden fixed top-0 inset-x-0 z-40 bg-sidebar/95 backdrop-blur border-b border-sidebar-border">
        <div className="flex items-center justify-between px-4 h-14">
          <Link href="/" className="flex items-center gap-2">
            <div className="size-8 rounded-xl bg-primary/10 grid place-items-center">
              <PawPrint className="size-4 text-primary" />
            </div>
            <span className="font-semibold tracking-tight">PetCare AI</span>
          </Link>
          <nav className="flex items-center gap-1">
            {NAV.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-label={item.label}
                  className={cn(
                    "relative size-9 rounded-lg grid place-items-center transition",
                    active
                      ? "bg-primary text-primary-foreground"
                      : item.danger
                        ? "text-destructive hover:bg-destructive/10"
                        : "text-sidebar-foreground hover:bg-sidebar-accent",
                  )}
                >
                  <Icon className="size-4" />
                  {item.badge && (
                    <span className="absolute top-1 right-1 size-1.5 rounded-full bg-accent" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <div className="no-print lg:hidden h-14" aria-hidden />

      <aside
        className="no-print hidden lg:flex fixed inset-y-0 left-0 w-72 flex-col bg-sidebar border-r border-sidebar-border"
        aria-label="Navigation principale"
      >
        <div className="px-6 pt-8 pb-6">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="size-11 rounded-2xl bg-gradient-to-br from-primary to-primary/70 grid place-items-center shadow-sm group-hover:scale-105 transition">
              <PawPrint className="size-5 text-primary-foreground" />
            </div>
            <div>
              <div className="text-lg font-semibold tracking-tight">
                PetCare AI
              </div>
              <div className="text-xs text-sidebar-foreground/60">
                Comprends ton animal
              </div>
            </div>
          </Link>
        </div>

        <nav className="px-3 flex flex-col gap-1">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition group",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : item.danger
                      ? "text-destructive hover:bg-destructive/10"
                      : "text-sidebar-foreground hover:bg-sidebar-accent",
                )}
              >
                <Icon
                  className={cn(
                    "size-4",
                    active
                      ? ""
                      : item.danger
                        ? "text-destructive"
                        : "text-sidebar-foreground/70 group-hover:text-sidebar-foreground",
                  )}
                />
                <span className="font-medium">{item.label}</span>
                {item.badge && (
                  <span
                    className={cn(
                      "ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                      active
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-accent/20 text-accent-foreground",
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto px-6 py-6">
          <div className="rounded-2xl bg-accent/15 border border-accent/25 p-4">
            <div className="text-xs font-semibold text-accent-foreground/80 uppercase tracking-wide">
              Disclaimer
            </div>
            <p className="text-xs text-sidebar-foreground/70 mt-1 leading-relaxed">
              Cet assistant est informatif. Pour toute urgence ou doute
              sérieux, consulte un vétérinaire.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}

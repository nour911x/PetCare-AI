"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Printer, Loader2, PawPrint } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  fetchPet,
  fetchWeights,
  fetchReminders,
  fetchHistory,
} from "@/lib/api";
import type {
  Pet,
  WeightHistory,
  Reminder,
  HistoryItem,
} from "@/types/api";

const SEX_LABEL: Record<string, string> = {
  male: "Mâle",
  femelle: "Femelle",
  inconnu: "Inconnu",
};

const CATEGORY_LABEL: Record<string, string> = {
  vaccin: "Vaccin",
  vermifuge: "Vermifuge",
  visite: "Visite véto",
  autre: "Autre",
};

const STATUS_LABEL: Record<string, string> = {
  en_retard: "En retard",
  bientot: "Bientôt",
  a_venir: "À venir",
  fait: "Fait",
};

const DIRECTION_LABEL: Record<string, string> = {
  hausse: "en hausse",
  baisse: "en baisse",
  stable: "stable",
  insuffisant: "données insuffisantes",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PetReport({ petId }: { petId: number }) {
  const [pet, setPet] = useState<Pet | null>(null);
  const [weights, setWeights] = useState<WeightHistory | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const p = await fetchPet(petId);
        setPet(p);
        const [w, r, h] = await Promise.all([
          fetchWeights(petId),
          fetchReminders({ petId }),
          fetchHistory({ petName: p.name }),
        ]);
        setWeights(w);
        setReminders(r);
        setHistory(h);
      } catch (err) {
        setError(true);
        toast.error(err instanceof Error ? err.message : "Erreur de chargement");
      } finally {
        setLoading(false);
      }
    })();
  }, [petId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
        <Loader2 className="size-6 animate-spin" />
        <span className="text-sm">Préparation du dossier…</span>
      </div>
    );
  }

  if (error || !pet) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-muted-foreground">Impossible de charger ce dossier.</p>
        <Button asChild variant="outline">
          <Link href="/pets">
            <ArrowLeft className="size-4" />
            Retour aux animaux
          </Link>
        </Button>
      </div>
    );
  }

  const speciesEmoji = pet.species === "chien" ? "🐕" : "🐈";
  const ins = weights?.insights;

  return (
    <div className="space-y-6">
      <div className="no-print flex items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/pets">
            <ArrowLeft className="size-4" />
            Retour
          </Link>
        </Button>
        <Button onClick={() => window.print()} className="rounded-xl">
          <Printer className="size-4" />
          Imprimer / Enregistrer en PDF
        </Button>
      </div>

      <div className="bg-card text-card-foreground rounded-2xl border border-border shadow-soft p-8 sm:p-10 space-y-8">
        <header className="flex items-start justify-between gap-4 border-b border-border pb-5 print-avoid-break">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-2xl bg-primary/10 grid place-items-center">
              <PawPrint className="size-6 text-primary" />
            </div>
            <div>
              <div className="text-xl font-bold tracking-tight">PetCare AI</div>
              <div className="text-sm text-muted-foreground">
                Dossier vétérinaire
              </div>
            </div>
          </div>
          <div className="text-right text-sm text-muted-foreground">
            Généré le {fmtDate(new Date().toISOString())}
          </div>
        </header>

        <section className="print-avoid-break">
          <h2 className="text-lg font-semibold mb-3">
            {speciesEmoji} {pet.name}
          </h2>
          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 text-sm">
            <Field label="Espèce" value={pet.species} className="capitalize" />
            <Field label="Race" value={pet.breed} />
            <Field
              label="Sexe"
              value={pet.sex ? SEX_LABEL[pet.sex] : null}
            />
            <Field label="Âge" value={pet.age_label} />
            <Field
              label="Date de naissance"
              value={pet.birthdate ? fmtDate(pet.birthdate) : null}
            />
            <Field
              label="Poids actuel"
              value={pet.weight_kg != null ? `${pet.weight_kg} kg` : null}
            />
            <Field
              label="Stérilisé·e"
              value={
                pet.sterilized == null ? null : pet.sterilized ? "Oui" : "Non"
              }
            />
            <Field
              label="Allergies"
              value={pet.allergies.length ? pet.allergies.join(", ") : null}
            />
          </dl>
          {pet.medical_notes && (
            <div className="mt-4 text-sm">
              <div className="text-muted-foreground">Notes médicales</div>
              <p className="mt-0.5 whitespace-pre-wrap">{pet.medical_notes}</p>
            </div>
          )}
        </section>

        <section className="print-avoid-break">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground border-b border-border pb-1.5 mb-3">
            Suivi du poids
          </h3>
          {weights && weights.entries.length > 0 ? (
            <>
              {ins && ins.count >= 2 && (
                <p className="text-sm mb-3">
                  Poids actuel : <strong>{ins.latest_kg} kg</strong> · évolution{" "}
                  {ins.change_kg != null && (
                    <>
                      de{" "}
                      <strong>
                        {ins.change_kg > 0 ? "+" : ""}
                        {ins.change_kg} kg
                      </strong>{" "}
                    </>
                  )}
                  (tendance {DIRECTION_LABEL[ins.direction]}).
                </p>
              )}
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="text-left text-muted-foreground border-b border-border">
                    <th className="py-1.5 font-medium">Date</th>
                    <th className="py-1.5 font-medium">Poids</th>
                    <th className="py-1.5 font-medium">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {weights.entries.map((e) => (
                    <tr key={e.id} className="border-b border-border/50">
                      <td className="py-1.5">{fmtDate(e.date)}</td>
                      <td className="py-1.5 tabular-nums">{e.weight_kg} kg</td>
                      <td className="py-1.5 text-muted-foreground">
                        {e.note || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {ins && ins.anomalies.length > 0 && (
                <div className="mt-3 text-sm">
                  <div className="font-medium text-destructive">
                    Variations à surveiller
                  </div>
                  <ul className="list-disc pl-5 mt-1">
                    {ins.anomalies.map((a, i) => (
                      <li key={i}>{a}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Aucune pesée enregistrée.
            </p>
          )}
        </section>

        <section className="print-avoid-break">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground border-b border-border pb-1.5 mb-3">
            Rappels de soins
          </h3>
          {reminders.length > 0 ? (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="py-1.5 font-medium">Soin</th>
                  <th className="py-1.5 font-medium">Catégorie</th>
                  <th className="py-1.5 font-medium">Échéance</th>
                  <th className="py-1.5 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody>
                {reminders.map((r) => (
                  <tr key={r.id} className="border-b border-border/50">
                    <td className="py-1.5">{r.title}</td>
                    <td className="py-1.5">{CATEGORY_LABEL[r.category]}</td>
                    <td className="py-1.5">{fmtDate(r.due_date)}</td>
                    <td className="py-1.5">{STATUS_LABEL[r.status]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-muted-foreground">
              Aucun rappel enregistré.
            </p>
          )}
        </section>

        <section>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground border-b border-border pb-1.5 mb-3">
            Historique des analyses ({history.length})
          </h3>
          {history.length > 0 ? (
            <div className="space-y-4">
              {history.map((a) => (
                <div
                  key={a.id}
                  className="text-sm border-b border-border/50 pb-3 print-avoid-break"
                >
                  <div className="flex flex-wrap items-center gap-x-2 text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {fmtDateTime(a.created_at)}
                    </span>
                    {a.emotion_data && (
                      <span>· émotion : {a.emotion_data.emotion}</span>
                    )}
                    {a.health_data && (
                      <span>· urgence : {a.health_data.urgency}</span>
                    )}
                  </div>
                  {a.question && (
                    <p className="mt-1 italic text-muted-foreground">
                      « {a.question} »
                    </p>
                  )}
                  <p className="mt-1 whitespace-pre-wrap">{a.answer}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Aucune analyse enregistrée pour {pet.name}.
            </p>
          )}
        </section>

        <footer className="border-t border-border pt-4 text-xs text-muted-foreground">
          Document généré par PetCare AI à titre informatif. Il ne remplace pas
          un examen vétérinaire.
        </footer>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  className,
}: {
  label: string;
  value: string | null | undefined;
  className?: string;
}) {
  return (
    <div>
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className={className}>{value || "—"}</dd>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import {
  Trash2,
  Calendar,
  Loader2,
  Inbox,
  Camera,
  Film,
  FileText,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import {
  fetchHistory,
  fetchPetNames,
  deleteAnalysis,
  mediaUrl,
} from "@/lib/api";
import type { HistoryItem } from "@/types/api";

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function HistoryList() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [pets, setPets] = useState<string[]>([]);
  const [filterSpecies, setFilterSpecies] = useState<string>("all");
  const [filterPet, setFilterPet] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [history, petNames] = await Promise.all([
        fetchHistory({
          species: filterSpecies === "all" ? undefined : filterSpecies,
          petName: filterPet === "all" ? undefined : filterPet,
        }),
        fetchPetNames(),
      ]);
      setItems(history);
      setPets(petNames);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterSpecies, filterPet]);

  async function handleDelete(id: number) {
    const ok = window.confirm("Supprimer définitivement cette analyse ?");
    if (!ok) return;
    try {
      await deleteAnalysis(id);
      toast.success("Analyse supprimée");
      setItems((curr) => curr.filter((a) => a.id !== id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur de suppression");
    }
  }

  return (
    <div className="space-y-6">
      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-3 glass shadow-soft rounded-2xl p-3">
        <Select value={filterSpecies} onValueChange={setFilterSpecies}>
          <SelectTrigger className="rounded-xl sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les espèces</SelectItem>
            <SelectItem value="chien">🐕 Chien</SelectItem>
            <SelectItem value="chat">🐈 Chat</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterPet} onValueChange={setFilterPet}>
          <SelectTrigger className="rounded-xl sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les animaux</SelectItem>
            {pets.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
          <Loader2 className="size-6 animate-spin" />
          <span className="text-sm">Chargement…</span>
        </div>
      ) : items.length === 0 ? (
        <Card className="rounded-3xl p-12 text-center border-border/60 shadow-soft">
          <div className="size-16 rounded-2xl bg-primary/10 grid place-items-center mx-auto mb-4">
            <Inbox className="size-8 text-primary" />
          </div>
          <h3 className="font-semibold text-lg">Aucune analyse pour le moment</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Lance une nouvelle analyse pour voir l&apos;historique apparaître ici.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <HistoryRow
              key={item.id}
              item={item}
              onDelete={() => handleDelete(item.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function HistoryRow({
  item,
  onDelete,
}: {
  item: HistoryItem;
  onDelete: () => void;
}) {
  const speciesEmoji = item.species === "chien" ? "🐕" : "🐈";
  const imgUrl = mediaUrl(item.image_path);
  const vidUrl = mediaUrl(item.video_path);

  const mediaIcon = vidUrl ? (
    <Film className="size-3.5" />
  ) : imgUrl ? (
    <Camera className="size-3.5" />
  ) : (
    <FileText className="size-3.5" />
  );

  return (
    <Card className="rounded-3xl overflow-hidden border-border/60 shadow-soft lift">
      <Accordion type="single" collapsible>
        <AccordionItem value="i" className="border-b-0">
          <AccordionTrigger className="px-6 py-5 hover:no-underline">
            <div className="flex items-center gap-4 w-full text-left">
              <div className="size-12 rounded-2xl bg-gradient-to-br from-primary/15 to-accent/15 grid place-items-center text-2xl shrink-0">
                {speciesEmoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  {item.health_data?.emoji && (
                    <span className="text-base">
                      {item.health_data.emoji}
                    </span>
                  )}
                  {item.pet_name && (
                    <span className="font-semibold">{item.pet_name}</span>
                  )}
                  {item.breed && (
                    <Badge variant="secondary" className="text-xs font-normal">
                      {item.breed}
                    </Badge>
                  )}
                  {item.emotion_data && (
                    <Badge variant="outline" className="text-xs">
                      {item.emotion_data.emoji}{" "}
                      <span className="capitalize ml-1">
                        {item.emotion_data.emotion.replace("_", " ")}
                      </span>
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="size-3" />
                  {formatDate(item.created_at)}
                  <span className="text-border">·</span>
                  {mediaIcon}
                </div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6 space-y-4">
            {vidUrl && (
              <div className="rounded-2xl overflow-hidden bg-muted">
                <video src={vidUrl} controls className="w-full max-h-[400px]" />
              </div>
            )}
            {!vidUrl && imgUrl && (
              <div className="rounded-2xl overflow-hidden bg-muted">
                <Image
                  src={imgUrl}
                  alt="Photo de l'analyse"
                  width={800}
                  height={500}
                  className="w-full h-auto max-h-[400px] object-contain"
                  unoptimized
                />
              </div>
            )}

            {item.question && (
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                  Description
                </div>
                <p className="text-sm">{item.question}</p>
              </div>
            )}

            {item.video_metrics && (
              <div className="grid grid-cols-3 gap-2">
                <Metric
                  label="Durée"
                  value={`${(item.video_metrics.duration_s || 0).toFixed(1)}s`}
                />
                <Metric
                  label="Activité"
                  value={`${Math.round(
                    (item.video_metrics.activity_score || 0) * 100,
                  )}%`}
                />
                <Metric
                  label="Détection"
                  value={`${Math.round(
                    (item.video_metrics.detection_rate || 0) * 100,
                  )}%`}
                />
              </div>
            )}

            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                Analyse
              </div>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">
                {item.answer}
              </p>
            </div>

            <div className="flex justify-end pt-2 border-t border-border/60">
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="size-4" />
                Supprimer
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/50 border border-border/50 p-3">
      <div className="text-lg font-bold tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

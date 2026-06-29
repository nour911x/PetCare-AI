"use client";

import { useState, useRef, useMemo } from "react";
import Image from "next/image";
import { toast } from "sonner";
import {
  Camera,
  Film,
  FileText,
  Loader2,
  Sparkles,
  Upload,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

import { ResultDisplay } from "@/components/ResultDisplay";
import {
  analyzeText,
  analyzeImage,
  analyzeVideo,
} from "@/lib/api";
import type { AnalysisResponse, Species } from "@/types/api";

const BREEDS: Record<Species, string[]> = {
  chien: [
    "Berger Allemand", "Berger Australien", "Border Collie",
    "Bouledogue Français", "Cavalier King Charles", "Chihuahua",
    "Cocker Spaniel", "Dogue Allemand", "Golden Retriever", "Husky",
    "Jack Russell", "Labrador", "Malinois", "Pitbull", "Poodle",
    "Rottweiler", "Shiba Inu", "Yorkshire Terrier", "Croisé / Inconnu",
  ],
  chat: [
    "Bengal", "Birman", "British Shorthair", "Chartreux", "Européen",
    "Maine Coon", "Norvégien", "Persan", "Ragdoll", "Russe Bleu",
    "Sacré de Birmanie", "Savannah", "Siamois", "Sphynx", "Croisé / Inconnu",
  ],
};

type MediaTab = "none" | "image" | "video";

export function AnalysisForm() {
  const [species, setSpecies] = useState<Species>("chien");
  const [breed, setBreed] = useState<string>("");
  const [petName, setPetName] = useState<string>("");
  const [question, setQuestion] = useState<string>("");
  const [mediaTab, setMediaTab] = useState<MediaTab>("none");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResponse | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const imagePreview = useMemo(
    () => (imageFile ? URL.createObjectURL(imageFile) : null),
    [imageFile],
  );
  const videoPreview = useMemo(
    () => (videoFile ? URL.createObjectURL(videoFile) : null),
    [videoFile],
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    void runAnalysis();
  }

  async function runAnalysis() {
    const hasText = question.trim().length > 0;
    const hasImage = mediaTab === "image" && imageFile;
    const hasVideo = mediaTab === "video" && videoFile;

    if (!hasText && !hasImage && !hasVideo) {
      toast.error("Décris d'abord le comportement ou envoie une photo / vidéo.");
      return;
    }

    setLoading(true);
    setResult(null);
    const toastId = toast.loading("Analyse en cours...");

    try {
      let res: AnalysisResponse;
      if (hasVideo) {
        res = await analyzeVideo({
          species,
          video: videoFile!,
          question,
          breed: breed || undefined,
          petName: petName || undefined,
        });
      } else if (hasImage) {
        res = await analyzeImage({
          species,
          image: imageFile!,
          question,
          breed: breed || undefined,
          petName: petName || undefined,
        });
      } else {
        res = await analyzeText({
          species,
          question,
          breed: breed || undefined,
          petName: petName || undefined,
        });
      }

      setResult(res);
      toast.success("Analyse terminée", { id: toastId });
      setTimeout(() => {
        document
          .getElementById("result-anchor")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Une erreur est survenue.";
      toast.error(message, { id: toastId });
    } finally {
      setLoading(false);
    }
  }

  function speciesEmoji(s: Species) {
    return s === "chien" ? "🐕" : "🐈";
  }

  return (
    <div className="space-y-10">
      <Card className="p-6 sm:p-8 rounded-3xl glass shadow-soft-lg lift">
        <form onSubmit={handleSubmit} className="space-y-7">
          {/* Espèce */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Espèce</Label>
            <div className="grid grid-cols-2 gap-3">
              {(["chien", "chat"] as Species[]).map((s) => {
                const active = species === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setSpecies(s);
                      setBreed("");
                    }}
                    className={cn(
                      "group/species rounded-2xl border-2 p-4 flex items-center gap-3 transition-all duration-300",
                      active
                        ? "border-primary bg-primary/10 shadow-soft -translate-y-0.5"
                        : "border-border hover:border-primary/40 hover:bg-muted/40 hover:-translate-y-0.5",
                    )}
                  >
                    <span
                      className={cn(
                        "text-3xl transition-transform duration-300 group-hover/species:scale-110 group-hover/species:-rotate-6",
                        active && "scale-110",
                      )}
                    >
                      {speciesEmoji(s)}
                    </span>
                    <div className="text-left">
                      <div className="font-semibold capitalize">{s}</div>
                      <div className="text-xs text-muted-foreground">
                        {s === "chien"
                          ? "Tous les chiens domestiques"
                          : "Tous les chats domestiques"}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Race + Nom */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="breed">Race (optionnel)</Label>
              <Select value={breed} onValueChange={setBreed}>
                <SelectTrigger id="breed" className="w-full rounded-xl">
                  <SelectValue placeholder="Choisir une race..." />
                </SelectTrigger>
                <SelectContent>
                  {BREEDS[species].map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="petName">Nom de l&apos;animal (optionnel)</Label>
              <Input
                id="petName"
                placeholder="Ex : Milou"
                value={petName}
                onChange={(e) => setPetName(e.target.value)}
                className="rounded-xl"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="question" className="text-sm font-semibold">
              Description du comportement
            </Label>
            <Textarea
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ex : Mon chien tourne autour de sa gamelle vide et me regarde fixement..."
              rows={4}
              className="resize-none rounded-xl text-base"
            />
            <p className="text-xs text-muted-foreground">
              Optionnel si tu envoies une photo ou une vidéo.
            </p>
          </div>

          {/* Média */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Média (optionnel)</Label>
            <Tabs
              value={mediaTab}
              onValueChange={(v) => setMediaTab(v as MediaTab)}
            >
              <TabsList className="w-full bg-muted/60 p-1 rounded-xl">
                <TabsTrigger value="none" className="flex-1 rounded-lg gap-1.5">
                  <FileText className="size-4" />
                  Aucun
                </TabsTrigger>
                <TabsTrigger value="image" className="flex-1 rounded-lg gap-1.5">
                  <Camera className="size-4" />
                  Photo
                </TabsTrigger>
                <TabsTrigger value="video" className="flex-1 rounded-lg gap-1.5">
                  <Film className="size-4" />
                  Vidéo
                </TabsTrigger>
              </TabsList>

              <TabsContent value="image" className="mt-4">
                {!imageFile ? (
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="w-full rounded-2xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 p-8 transition flex flex-col items-center gap-2"
                  >
                    <div className="size-12 rounded-full bg-primary/10 grid place-items-center">
                      <Upload className="size-5 text-primary" />
                    </div>
                    <div className="text-sm font-medium">
                      Déposer une photo ou cliquer pour choisir
                    </div>
                    <div className="text-xs text-muted-foreground">
                      JPG, PNG, WebP, jusqu&apos;à 10 MB
                    </div>
                  </button>
                ) : (
                  <div className="relative rounded-2xl overflow-hidden border border-border">
                    {imagePreview && (
                      <Image
                        src={imagePreview}
                        alt="Aperçu"
                        width={800}
                        height={500}
                        unoptimized
                        className="w-full h-auto max-h-[400px] object-contain bg-muted"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => setImageFile(null)}
                      className="absolute top-3 right-3 size-8 rounded-full bg-background/90 backdrop-blur grid place-items-center hover:bg-destructive hover:text-destructive-foreground transition"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                )}
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </TabsContent>

              <TabsContent value="video" className="mt-4">
                {!videoFile ? (
                  <button
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                    className="w-full rounded-2xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 p-8 transition flex flex-col items-center gap-2"
                  >
                    <div className="size-12 rounded-full bg-primary/10 grid place-items-center">
                      <Film className="size-5 text-primary" />
                    </div>
                    <div className="text-sm font-medium">
                      Déposer une vidéo ou cliquer pour choisir
                    </div>
                    <div className="text-xs text-muted-foreground">
                      MP4, MOV, WebM, 20 secondes max
                    </div>
                  </button>
                ) : (
                  <div className="relative rounded-2xl overflow-hidden border border-border bg-muted">
                    {videoPreview && (
                      <video
                        src={videoPreview}
                        controls
                        className="w-full max-h-[400px]"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => setVideoFile(null)}
                      className="absolute top-3 right-3 size-8 rounded-full bg-background/90 backdrop-blur grid place-items-center hover:bg-destructive hover:text-destructive-foreground transition"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                )}
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/mp4,video/quicktime,video/webm,video/x-matroska"
                  onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            size="lg"
            disabled={loading}
            className="shimmer relative overflow-hidden w-full rounded-2xl text-base h-13 py-3.5 shadow-soft-lg bg-gradient-to-r from-primary to-[color-mix(in_oklch,var(--primary),var(--accent)_45%)] hover:opacity-95 active:translate-y-px"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Analyse en cours...
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                Analyser le comportement
              </>
            )}
          </Button>
        </form>
      </Card>

      <div id="result-anchor" />
      {result && <ResultDisplay result={result} />}
    </div>
  );
}

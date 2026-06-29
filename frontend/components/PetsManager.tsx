"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  X,
  Save,
  ImagePlus,
  Cake,
  Weight,
  Heart,
  Syringe,
  Mars,
  Venus,
  PawPrint,
  ChartLine,
  FileDown,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { WeightTracker } from "@/components/WeightTracker";
import { BREEDS } from "@/lib/breeds";
import { cn } from "@/lib/utils";
import {
  fetchPets,
  createPet,
  updatePet,
  deletePet,
  uploadPetAvatar,
  mediaUrl,
} from "@/lib/api";
import type { Pet, PetInput, PetSex, Species } from "@/types/api";

interface FormState {
  name: string;
  species: Species;
  breed: string;
  sex: PetSex | "";
  birthdate: string;
  weight_kg: string;
  sterilized: "oui" | "non" | "";
  allergies: string;
  medical_notes: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  species: "chien",
  breed: "",
  sex: "",
  birthdate: "",
  weight_kg: "",
  sterilized: "",
  allergies: "",
  medical_notes: "",
};

function petToForm(p: Pet): FormState {
  return {
    name: p.name,
    species: p.species,
    breed: p.breed ?? "",
    sex: p.sex ?? "",
    birthdate: p.birthdate ?? "",
    weight_kg: p.weight_kg != null ? String(p.weight_kg) : "",
    sterilized: p.sterilized == null ? "" : p.sterilized ? "oui" : "non",
    allergies: p.allergies.join(", "),
    medical_notes: p.medical_notes ?? "",
  };
}

function formToInput(f: FormState): PetInput {
  return {
    name: f.name.trim(),
    species: f.species,
    breed: f.breed || null,
    sex: f.sex || null,
    birthdate: f.birthdate || null,
    weight_kg: f.weight_kg ? Number(f.weight_kg) : null,
    sterilized: f.sterilized === "" ? null : f.sterilized === "oui",
    allergies: f.allergies
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean),
    medical_notes: f.medical_notes.trim() || null,
  };
}

export function PetsManager() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<number | "new" | null>(null);
  const [weightPetId, setWeightPetId] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    try {
      setPets(await fetchPets());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleDelete(pet: Pet) {
    const ok = window.confirm(`Supprimer définitivement la fiche de ${pet.name} ?`);
    if (!ok) return;
    try {
      await deletePet(pet.id);
      toast.success("Fiche supprimée");
      setPets((curr) => curr.filter((p) => p.id !== pet.id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur de suppression");
    }
  }

  const editingPet =
    typeof editing === "number" ? pets.find((p) => p.id === editing) : undefined;
  const weightPet = pets.find((p) => p.id === weightPetId);

  return (
    <div className="space-y-6">
      {weightPet ? (
        <WeightTracker
          key={weightPet.id}
          pet={weightPet}
          onClose={() => {
            setWeightPetId(null);
            void load();
          }}
        />
      ) : editing === null ? (
        <Button
          size="lg"
          onClick={() => setEditing("new")}
          className="rounded-2xl shadow-soft bg-gradient-to-r from-primary to-[color-mix(in_oklch,var(--primary),var(--accent)_45%)]"
        >
          <Plus className="size-4" />
          Ajouter un animal
        </Button>
      ) : (
        <PetForm
          key={editing}
          pet={editingPet}
          onClose={() => setEditing(null)}
          onSaved={(saved) => {
            setPets((curr) => {
              const exists = curr.some((p) => p.id === saved.id);
              return exists
                ? curr.map((p) => (p.id === saved.id ? saved : p))
                : [saved, ...curr];
            });
            setEditing(null);
          }}
        />
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
          <Loader2 className="size-6 animate-spin" />
          <span className="text-sm">Chargement…</span>
        </div>
      ) : pets.length === 0 ? (
        <Card className="rounded-3xl p-12 text-center border-border/60 shadow-soft">
          <div className="size-16 rounded-2xl bg-primary/10 grid place-items-center mx-auto mb-4">
            <PawPrint className="size-8 text-primary" />
          </div>
          <h3 className="font-semibold text-lg">Aucun animal enregistré</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Crée la fiche de ton animal pour contextualiser chaque analyse.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {pets.map((pet) => (
            <PetCard
              key={pet.id}
              pet={pet}
              onEdit={() => {
                setWeightPetId(null);
                setEditing(pet.id);
              }}
              onWeight={() => {
                setEditing(null);
                setWeightPetId(pet.id);
              }}
              onDelete={() => handleDelete(pet)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PetCard({
  pet,
  onEdit,
  onWeight,
  onDelete,
}: {
  pet: Pet;
  onEdit: () => void;
  onWeight: () => void;
  onDelete: () => void;
}) {
  const avatar = mediaUrl(pet.avatar_path);
  const emoji = pet.species === "chien" ? "🐕" : "🐈";

  return (
    <Card className="rounded-3xl p-5 border-border/60 shadow-soft lift">
      <div className="flex gap-4">
        <div className="relative size-20 rounded-2xl overflow-hidden bg-gradient-to-br from-primary/15 to-accent/15 grid place-items-center shrink-0 ring-1 ring-border/60">
          {avatar ? (
            <Image
              src={avatar}
              alt={pet.name}
              fill
              sizes="80px"
              className="object-cover"
              unoptimized
            />
          ) : (
            <span className="text-4xl">{emoji}</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-lg truncate">{pet.name}</h3>
            {pet.sex === "male" && <Mars className="size-4 text-primary" />}
            {pet.sex === "femelle" && <Venus className="size-4 text-accent" />}
          </div>
          <p className="text-sm text-muted-foreground">
            {emoji} {pet.breed || "Race inconnue"}
          </p>

          <div className="mt-2 flex flex-wrap gap-1.5">
            {pet.age_label && (
              <Badge variant="secondary" className="gap-1 font-normal">
                <Cake className="size-3" />
                {pet.age_label}
              </Badge>
            )}
            {pet.weight_kg != null && (
              <Badge variant="secondary" className="gap-1 font-normal">
                <Weight className="size-3" />
                {pet.weight_kg} kg
              </Badge>
            )}
            {pet.sterilized && (
              <Badge variant="outline" className="gap-1 font-normal">
                <Heart className="size-3" />
                Stérilisé·e
              </Badge>
            )}
          </div>
        </div>
      </div>

      {(pet.allergies.length > 0 || pet.medical_notes) && (
        <div className="mt-4 space-y-2 border-t border-border/60 pt-3">
          {pet.allergies.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 text-sm">
              <Syringe className="size-3.5 text-destructive shrink-0" />
              <span className="text-muted-foreground">Allergies :</span>
              {pet.allergies.map((a) => (
                <Badge key={a} variant="outline" className="font-normal">
                  {a}
                </Badge>
              ))}
            </div>
          )}
          {pet.medical_notes && (
            <p className="text-sm text-muted-foreground">{pet.medical_notes}</p>
          )}
        </div>
      )}

      <div className="mt-4 flex justify-end gap-1 border-t border-border/60 pt-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onWeight}
          className="mr-auto"
        >
          <ChartLine className="size-4" />
          Suivi du poids
        </Button>
        <Button asChild variant="ghost" size="sm">
          <Link href={`/report?pet=${pet.id}`}>
            <FileDown className="size-4" />
            Exporter PDF
          </Link>
        </Button>
        <Button variant="ghost" size="sm" onClick={onEdit}>
          <Pencil className="size-4" />
          Modifier
        </Button>
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
    </Card>
  );
}

function PetForm({
  pet,
  onClose,
  onSaved,
}: {
  pet?: Pet;
  onClose: () => void;
  onSaved: (pet: Pet) => void;
}) {
  const [form, setForm] = useState<FormState>(
    pet ? petToForm(pet) : EMPTY_FORM,
  );
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const avatarPreview = useMemo(
    () =>
      avatarFile
        ? URL.createObjectURL(avatarFile)
        : mediaUrl(pet?.avatar_path ?? null),
    [avatarFile, pet?.avatar_path],
  );

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Le nom de l'animal est requis.");
      return;
    }

    setSaving(true);
    const toastId = toast.loading("Enregistrement…");
    try {
      const input = formToInput(form);
      let saved = pet
        ? await updatePet(pet.id, input)
        : await createPet(input);

      if (avatarFile) {
        saved = await uploadPetAvatar(saved.id, avatarFile);
      }

      toast.success(pet ? "Fiche mise à jour" : "Fiche créée", { id: toastId });
      onSaved(saved);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur d'enregistrement", {
        id: toastId,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="p-6 sm:p-8 rounded-3xl glass shadow-soft-lg fade-up">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {pet ? `Modifier ${pet.name}` : "Nouvelle fiche animal"}
          </h2>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Fermer"
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="relative size-20 rounded-2xl overflow-hidden bg-muted grid place-items-center ring-1 ring-border/60 hover:ring-primary/50 transition shrink-0"
          >
            {avatarPreview ? (
              <Image
                src={avatarPreview}
                alt="Aperçu"
                fill
                sizes="80px"
                className="object-cover"
                unoptimized
              />
            ) : (
              <ImagePlus className="size-6 text-muted-foreground" />
            )}
          </button>
          <div className="text-sm text-muted-foreground">
            <div className="font-medium text-foreground">Photo (optionnel)</div>
            Clique sur le carré pour choisir une image.
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
            className="hidden"
          />
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-semibold">Espèce</Label>
          <div className="grid grid-cols-2 gap-3">
            {(["chien", "chat"] as Species[]).map((s) => {
              const active = form.species === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    set("species", s);
                    set("breed", "");
                  }}
                  className={cn(
                    "rounded-2xl border-2 p-3 flex items-center gap-3 transition-all",
                    active
                      ? "border-primary bg-primary/10 shadow-soft"
                      : "border-border hover:border-primary/40 hover:bg-muted/40",
                  )}
                >
                  <span className="text-2xl">{s === "chien" ? "🐕" : "🐈"}</span>
                  <span className="font-semibold capitalize">{s}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom *</Label>
            <Input
              id="name"
              placeholder="Ex : Milou"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="breed">Race (optionnel)</Label>
            <Select value={form.breed} onValueChange={(v) => set("breed", v)}>
              <SelectTrigger id="breed" className="w-full rounded-xl">
                <SelectValue placeholder="Choisir une race..." />
              </SelectTrigger>
              <SelectContent>
                {BREEDS[form.species].map((b) => (
                  <SelectItem key={b} value={b}>
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="sex">Sexe (optionnel)</Label>
            <Select
              value={form.sex || undefined}
              onValueChange={(v) => set("sex", v as PetSex)}
            >
              <SelectTrigger id="sex" className="w-full rounded-xl">
                <SelectValue placeholder="Non précisé" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Mâle</SelectItem>
                <SelectItem value="femelle">Femelle</SelectItem>
                <SelectItem value="inconnu">Inconnu</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sterilized">Stérilisé·e (optionnel)</Label>
            <Select
              value={form.sterilized || undefined}
              onValueChange={(v) => set("sterilized", v as "oui" | "non")}
            >
              <SelectTrigger id="sterilized" className="w-full rounded-xl">
                <SelectValue placeholder="Non précisé" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="oui">Oui</SelectItem>
                <SelectItem value="non">Non</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="birthdate">Date de naissance (optionnel)</Label>
            <Input
              id="birthdate"
              type="date"
              value={form.birthdate}
              onChange={(e) => set("birthdate", e.target.value)}
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="weight">Poids en kg (optionnel)</Label>
            <Input
              id="weight"
              type="number"
              step="0.1"
              min="0"
              placeholder="Ex : 12.5"
              value={form.weight_kg}
              onChange={(e) => set("weight_kg", e.target.value)}
              className="rounded-xl"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="allergies">Allergies (optionnel)</Label>
          <Input
            id="allergies"
            placeholder="Sépare par des virgules, ex : poulet, pollen"
            value={form.allergies}
            onChange={(e) => set("allergies", e.target.value)}
            className="rounded-xl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes médicales (optionnel)</Label>
          <Textarea
            id="notes"
            rows={3}
            placeholder="Traitements en cours, antécédents, particularités…"
            value={form.medical_notes}
            onChange={(e) => set("medical_notes", e.target.value)}
            className="resize-none rounded-xl"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" disabled={saving} className="rounded-xl">
            {saving ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Enregistrement…
              </>
            ) : (
              <>
                <Save className="size-4" />
                {pet ? "Enregistrer" : "Créer la fiche"}
              </>
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
}

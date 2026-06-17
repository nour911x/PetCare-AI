"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Loader2,
  X,
  Bell,
  Syringe,
  Pill,
  Stethoscope,
  Circle,
  CircleCheck,
  PawPrint,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { cn } from "@/lib/utils";
import {
  fetchPets,
  fetchReminders,
  createReminder,
  updateReminder,
  deleteReminder,
} from "@/lib/api";
import type {
  Pet,
  Reminder,
  ReminderCategory,
  ReminderStatus,
} from "@/types/api";

const CATEGORIES: Record<
  ReminderCategory,
  { label: string; icon: typeof Bell }
> = {
  vaccin: { label: "Vaccin", icon: Syringe },
  vermifuge: { label: "Vermifuge", icon: Pill },
  visite: { label: "Visite véto", icon: Stethoscope },
  autre: { label: "Autre", icon: Bell },
};

const STATUS_META: Record<
  ReminderStatus,
  { label: string; text: string; bar: string }
> = {
  en_retard: {
    label: "En retard",
    text: "text-destructive",
    bar: "bg-destructive",
  },
  bientot: { label: "Bientôt", text: "text-amber-600", bar: "bg-amber-500" },
  a_venir: { label: "À venir", text: "text-primary", bar: "bg-primary" },
  fait: { label: "Fait", text: "text-emerald-600", bar: "bg-emerald-500" },
};

const GROUP_ORDER: ReminderStatus[] = [
  "en_retard",
  "bientot",
  "a_venir",
  "fait",
];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function relative(days: number | null) {
  if (days == null) return "";
  if (days < 0) return `il y a ${Math.abs(days)} j`;
  if (days === 0) return "aujourd'hui";
  return `dans ${days} j`;
}

export function RemindersManager() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [p, r] = await Promise.all([fetchPets(), fetchReminders()]);
      setPets(p);
      setReminders(r);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const petName = (id: number) =>
    pets.find((p) => p.id === id)?.name ?? "Animal supprimé";

  async function toggleDone(reminder: Reminder) {
    try {
      const updated = await updateReminder(reminder.id, {
        done: !reminder.done,
      });
      setReminders((curr) =>
        curr.map((r) => (r.id === updated.id ? updated : r)),
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteReminder(id);
      setReminders((curr) => curr.filter((r) => r.id !== id));
      toast.success("Rappel supprimé");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur de suppression");
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
        <Loader2 className="size-6 animate-spin" />
        <span className="text-sm">Chargement…</span>
      </div>
    );
  }

  if (pets.length === 0) {
    return (
      <Card className="rounded-3xl p-12 text-center border-border/60 shadow-soft">
        <div className="size-16 rounded-2xl bg-primary/10 grid place-items-center mx-auto mb-4">
          <PawPrint className="size-8 text-primary" />
        </div>
        <h3 className="font-semibold text-lg">Crée d&apos;abord une fiche animal</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Les rappels sont rattachés à un animal. Va dans « Mes animaux » pour
          en ajouter un.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {showForm ? (
        <ReminderForm
          pets={pets}
          onClose={() => setShowForm(false)}
          onSaved={(created) => {
            setReminders((curr) => [...curr, created]);
            setShowForm(false);
          }}
        />
      ) : (
        <Button
          size="lg"
          onClick={() => setShowForm(true)}
          className="rounded-2xl shadow-soft bg-gradient-to-r from-primary to-[color-mix(in_oklch,var(--primary),var(--accent)_45%)]"
        >
          <Plus className="size-4" />
          Ajouter un rappel
        </Button>
      )}

      {reminders.length === 0 ? (
        <Card className="rounded-3xl p-12 text-center border-border/60 shadow-soft">
          <div className="size-16 rounded-2xl bg-primary/10 grid place-items-center mx-auto mb-4">
            <Bell className="size-8 text-primary" />
          </div>
          <h3 className="font-semibold text-lg">Aucun rappel pour le moment</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Ajoute un rappel de vaccin, vermifuge ou visite vétérinaire.
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {GROUP_ORDER.map((status) => {
            const group = reminders.filter((r) => r.status === status);
            if (group.length === 0) return null;
            return (
              <div key={status} className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "size-2 rounded-full",
                      STATUS_META[status].bar,
                    )}
                  />
                  <h3
                    className={cn(
                      "text-sm font-semibold uppercase tracking-wide",
                      STATUS_META[status].text,
                    )}
                  >
                    {STATUS_META[status].label}
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    ({group.length})
                  </span>
                </div>
                {group.map((reminder) => (
                  <ReminderRow
                    key={reminder.id}
                    reminder={reminder}
                    petName={petName(reminder.pet_id)}
                    onToggle={() => toggleDone(reminder)}
                    onDelete={() => handleDelete(reminder.id)}
                  />
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ReminderRow({
  reminder,
  petName,
  onToggle,
  onDelete,
}: {
  reminder: Reminder;
  petName: string;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const cat = CATEGORIES[reminder.category];
  const CatIcon = cat.icon;
  const status = STATUS_META[reminder.status];

  return (
    <Card
      className={cn(
        "rounded-2xl border-border/60 shadow-soft lift p-4 flex items-center gap-3",
        reminder.done && "opacity-60",
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-label={reminder.done ? "Marquer comme à faire" : "Marquer comme fait"}
        className="shrink-0 text-muted-foreground hover:text-primary transition"
      >
        {reminder.done ? (
          <CircleCheck className="size-6 text-emerald-600" />
        ) : (
          <Circle className="size-6" />
        )}
      </button>

      <div className="size-10 rounded-xl bg-primary/10 grid place-items-center shrink-0">
        <CatIcon className="size-5 text-primary" />
      </div>

      <div className="flex-1 min-w-0">
        <div
          className={cn(
            "font-medium truncate",
            reminder.done && "line-through",
          )}
        >
          {reminder.title}
        </div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
          <Badge variant="secondary" className="font-normal">
            {petName}
          </Badge>
          <span>{formatDate(reminder.due_date)}</span>
          {reminder.days_until != null && (
            <span className={cn("font-medium", status.text)}>
              · {relative(reminder.days_until)}
            </span>
          )}
          {reminder.notes && (
            <span className="truncate">· {reminder.notes}</span>
          )}
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={onDelete}
        aria-label="Supprimer le rappel"
        className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
      >
        <Trash2 className="size-4" />
      </Button>
    </Card>
  );
}

function ReminderForm({
  pets,
  onClose,
  onSaved,
}: {
  pets: Pet[];
  onClose: () => void;
  onSaved: (reminder: Reminder) => void;
}) {
  const [petId, setPetId] = useState<string>(String(pets[0].id));
  const [category, setCategory] = useState<ReminderCategory>("vaccin");
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState(todayISO());
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Donne un titre au rappel.");
      return;
    }
    if (!dueDate) {
      toast.error("Choisis une date d'échéance.");
      return;
    }
    setSaving(true);
    try {
      const created = await createReminder({
        pet_id: Number(petId),
        title: title.trim(),
        category,
        due_date: dueDate,
        notes: notes.trim() || null,
      });
      toast.success("Rappel ajouté");
      onSaved(created);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur d'ajout");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="p-6 sm:p-8 rounded-3xl glass shadow-soft-lg fade-up">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Nouveau rappel</h2>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="r-pet">Animal</Label>
            <Select value={petId} onValueChange={setPetId}>
              <SelectTrigger id="r-pet" className="w-full rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pets.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.species === "chien" ? "🐕" : "🐈"} {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="r-cat">Catégorie</Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as ReminderCategory)}
            >
              <SelectTrigger id="r-cat" className="w-full rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(CATEGORIES) as ReminderCategory[]).map((c) => (
                  <SelectItem key={c} value={c}>
                    {CATEGORIES[c].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="r-title">Titre</Label>
          <Input
            id="r-title"
            placeholder="Ex : Rappel vaccin CHPL"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-xl"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="r-date">Échéance</Label>
            <Input
              id="r-date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="r-notes">Note (optionnel)</Label>
            <Input
              id="r-notes"
              placeholder="Ex : chez Dr Martin"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="rounded-xl"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" disabled={saving} className="rounded-xl">
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            Ajouter le rappel
          </Button>
        </div>
      </form>
    </Card>
  );
}

import type { Species } from "@/types/api";

/** Listes de races par espèce, réutilisées dans les fiches et l'analyse. */
export const BREEDS: Record<Species, string[]> = {
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

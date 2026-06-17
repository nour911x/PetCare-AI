import type {
  AnalysisResponse,
  HistoryItem,
  Pet,
  PetInput,
  BreedBenchmark,
  InsightsResponse,
  OnboardingPlan,
  Reminder,
  ReminderInput,
  ReminderUpdate,
  Species,
  StatsResponse,
  WeightEntry,
  WeightEntryInput,
  WeightHistory,
} from "@/types/api";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const data = await res.json();
      if (typeof data.detail === "string") {
        detail = data.detail;
      } else if (Array.isArray(data.detail)) {
        detail =
          data.detail
            .map((e: { msg?: string }) => e.msg)
            .filter(Boolean)
            .join(", ") || detail;
      } else if (data.detail) {
        detail = JSON.stringify(data.detail);
      }
    } catch {
    }
    throw new ApiError(detail, res.status);
  }
  return res.json();
}

export function mediaUrl(absoluteOrRelativePath: string | null): string | null {
  if (!absoluteOrRelativePath) return null;
  const fileName = absoluteOrRelativePath.split(/[\\/]/).pop();
  if (!fileName) return null;
  return `${API_URL}/api/media/${encodeURIComponent(fileName)}`;
}

export interface AnalyzeTextParams {
  species: Species;
  question: string;
  breed?: string;
  petName?: string;
}

export async function analyzeText(
  params: AnalyzeTextParams,
): Promise<AnalysisResponse> {
  const fd = new FormData();
  fd.append("species", params.species);
  fd.append("question", params.question);
  if (params.breed) fd.append("breed", params.breed);
  if (params.petName) fd.append("pet_name", params.petName);

  const res = await fetch(`${API_URL}/api/analyze/text`, {
    method: "POST",
    body: fd,
  });
  return handleResponse<AnalysisResponse>(res);
}

export interface AnalyzeImageParams {
  species: Species;
  image: File;
  question?: string;
  breed?: string;
  petName?: string;
}

export async function analyzeImage(
  params: AnalyzeImageParams,
): Promise<AnalysisResponse> {
  const fd = new FormData();
  fd.append("species", params.species);
  fd.append("image", params.image);
  fd.append("question", params.question || "");
  if (params.breed) fd.append("breed", params.breed);
  if (params.petName) fd.append("pet_name", params.petName);

  const res = await fetch(`${API_URL}/api/analyze/image`, {
    method: "POST",
    body: fd,
  });
  return handleResponse<AnalysisResponse>(res);
}

export interface AnalyzeVideoParams {
  species: Species;
  video: File;
  question?: string;
  breed?: string;
  petName?: string;
}

export async function analyzeVideo(
  params: AnalyzeVideoParams,
): Promise<AnalysisResponse> {
  const fd = new FormData();
  fd.append("species", params.species);
  fd.append("video", params.video);
  fd.append("question", params.question || "");
  if (params.breed) fd.append("breed", params.breed);
  if (params.petName) fd.append("pet_name", params.petName);

  const res = await fetch(`${API_URL}/api/analyze/video`, {
    method: "POST",
    body: fd,
  });
  return handleResponse<AnalysisResponse>(res);
}

export async function fetchHistory(
  filters: { species?: string; petName?: string } = {},
): Promise<HistoryItem[]> {
  const params = new URLSearchParams();
  if (filters.species) params.set("species", filters.species);
  if (filters.petName) params.set("pet_name", filters.petName);
  const qs = params.toString();
  const res = await fetch(
    `${API_URL}/api/history${qs ? `?${qs}` : ""}`,
    { cache: "no-store" },
  );
  return handleResponse<HistoryItem[]>(res);
}

export async function deleteAnalysis(id: number): Promise<void> {
  const res = await fetch(`${API_URL}/api/history/${id}`, {
    method: "DELETE",
  });
  await handleResponse(res);
}

export async function fetchPetNames(): Promise<string[]> {
  const res = await fetch(`${API_URL}/api/history/pet-names`, {
    cache: "no-store",
  });
  return handleResponse<string[]>(res);
}

export async function fetchStats(): Promise<StatsResponse> {
  const res = await fetch(`${API_URL}/api/stats`, { cache: "no-store" });
  return handleResponse<StatsResponse>(res);
}

export async function fetchPets(species?: string): Promise<Pet[]> {
  const qs = species ? `?species=${encodeURIComponent(species)}` : "";
  const res = await fetch(`${API_URL}/api/pets${qs}`, { cache: "no-store" });
  return handleResponse<Pet[]>(res);
}

export async function fetchPet(id: number): Promise<Pet> {
  const res = await fetch(`${API_URL}/api/pets/${id}`, { cache: "no-store" });
  return handleResponse<Pet>(res);
}

export async function createPet(input: PetInput): Promise<Pet> {
  const res = await fetch(`${API_URL}/api/pets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return handleResponse<Pet>(res);
}

export async function updatePet(
  id: number,
  input: Partial<PetInput>,
): Promise<Pet> {
  const res = await fetch(`${API_URL}/api/pets/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return handleResponse<Pet>(res);
}

export async function deletePet(id: number): Promise<void> {
  const res = await fetch(`${API_URL}/api/pets/${id}`, { method: "DELETE" });
  await handleResponse(res);
}

export async function uploadPetAvatar(id: number, file: File): Promise<Pet> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`${API_URL}/api/pets/${id}/avatar`, {
    method: "POST",
    body: fd,
  });
  return handleResponse<Pet>(res);
}

export async function fetchWeights(petId: number): Promise<WeightHistory> {
  const res = await fetch(`${API_URL}/api/pets/${petId}/weights`, {
    cache: "no-store",
  });
  return handleResponse<WeightHistory>(res);
}

export async function addWeight(
  petId: number,
  input: WeightEntryInput,
): Promise<WeightEntry> {
  const res = await fetch(`${API_URL}/api/pets/${petId}/weights`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return handleResponse<WeightEntry>(res);
}

export async function deleteWeight(
  petId: number,
  entryId: number,
): Promise<void> {
  const res = await fetch(`${API_URL}/api/pets/${petId}/weights/${entryId}`, {
    method: "DELETE",
  });
  await handleResponse(res);
}

export async function fetchBenchmarks(
  breed: string,
  species?: string,
): Promise<BreedBenchmark> {
  const qs = new URLSearchParams({ breed });
  if (species) qs.set("species", species);
  const res = await fetch(`${API_URL}/api/benchmarks?${qs.toString()}`, {
    cache: "no-store",
  });
  return handleResponse<BreedBenchmark>(res);
}

export async function fetchOnboarding(params: {
  species: string;
  ageMonths?: number | null;
  breed?: string | null;
}): Promise<OnboardingPlan> {
  const qs = new URLSearchParams({ species: params.species });
  if (params.ageMonths != null) qs.set("age_months", String(params.ageMonths));
  if (params.breed) qs.set("breed", params.breed);
  const res = await fetch(`${API_URL}/api/onboarding?${qs.toString()}`, {
    cache: "no-store",
  });
  return handleResponse<OnboardingPlan>(res);
}

export async function fetchInsights(petName?: string): Promise<InsightsResponse> {
  const qs = petName ? `?pet_name=${encodeURIComponent(petName)}` : "";
  const res = await fetch(`${API_URL}/api/insights${qs}`, {
    cache: "no-store",
  });
  return handleResponse<InsightsResponse>(res);
}

export async function fetchReminders(filters: {
  petId?: number;
  includeDone?: boolean;
} = {}): Promise<Reminder[]> {
  const params = new URLSearchParams();
  if (filters.petId != null) params.set("pet_id", String(filters.petId));
  if (filters.includeDone === false) params.set("include_done", "false");
  const qs = params.toString();
  const res = await fetch(`${API_URL}/api/reminders${qs ? `?${qs}` : ""}`, {
    cache: "no-store",
  });
  return handleResponse<Reminder[]>(res);
}

export async function createReminder(input: ReminderInput): Promise<Reminder> {
  const res = await fetch(`${API_URL}/api/reminders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return handleResponse<Reminder>(res);
}

export async function updateReminder(
  id: number,
  input: ReminderUpdate,
): Promise<Reminder> {
  const res = await fetch(`${API_URL}/api/reminders/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return handleResponse<Reminder>(res);
}

export async function deleteReminder(id: number): Promise<void> {
  const res = await fetch(`${API_URL}/api/reminders/${id}`, {
    method: "DELETE",
  });
  await handleResponse(res);
}

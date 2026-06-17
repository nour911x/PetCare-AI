"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PetReport } from "@/components/PetReport";

function ReportContent() {
  const params = useSearchParams();
  const raw = params.get("pet");
  const petId = raw ? Number(raw) : NaN;

  if (!raw || Number.isNaN(petId)) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-muted-foreground">Aucun animal sélectionné.</p>
        <Button asChild variant="outline">
          <Link href="/pets">
            <ArrowLeft className="size-4" />
            Choisir un animal
          </Link>
        </Button>
      </div>
    );
  }

  return <PetReport petId={petId} />;
}

export default function ReportPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-16 text-muted-foreground">
          <Loader2 className="size-6 animate-spin" />
        </div>
      }
    >
      <ReportContent />
    </Suspense>
  );
}

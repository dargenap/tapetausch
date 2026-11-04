import { useEffect, useState } from "react";
import { AppHeader } from "../components/AppHeader";
import { PickCard } from "../components/PickCard";
import { useAuth } from "../hooks/useAuth";
import { fetchCollection } from "../lib/saves";
import type { Pick } from "../types";

export default function CollectionPage() {
  const { profile } = useAuth();
  const [picks, setPicks] = useState<Pick[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!profile) return;

    fetchCollection(profile.id)
      .then(setPicks)
      .catch((err) =>
        setError(
          err instanceof Error ? err.message : "Etwas ist schiefgelaufen.",
        ),
      );
  }, [profile]);

  return (
    <main>
      <AppHeader />
      <h2 className="page-title">Meine Sammlung</h2>

      {error && <p role="alert">{error}</p>}
      {!picks && !error && <p className="muted">Lädt …</p>}
      {picks?.length === 0 && <p className="muted">Noch nichts überspielt.</p>}

      {/* Nur das Cover, das Foto gibt es erst beim Öffnen des Picks. */}
      {picks?.map((pick) => (
        <PickCard key={pick.id} pick={pick} showDetailLink />
      ))}
    </main>
  );
}

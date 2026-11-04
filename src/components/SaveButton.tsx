import type { Pick } from "../types";
import { useAuth } from "../hooks/useAuth";
import { useState } from "react";
import { savePick, unsavePick } from "../lib/saves";

type Props = { pick: Pick };

export function SaveButton({ pick }: Props) {
  const { profile } = useAuth();
  const [saved, setSaved] = useState(
    pick.saves.some((s) => s.user_id === profile?.id),
  );
  const [count, setCount] = useState(pick.saves.length);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const isOwn = pick.user_id === profile?.id;
  const label =
    count > 0
      ? `auf ${count} ${count === 1 ? "Kassette" : "Kassetten"} überspielt`
      : "";

  if (isOwn) return label ? <p className="muted">{label}</p> : null;

  async function toggle() {
    const next = !saved;
    setSaved(next);
    setCount((c) => c + (next ? 1 : -1));
    setBusy(true);
    setError("");

    try {
      if (next) await savePick(pick.id);
      else await unsavePick(pick.id);
    } catch (err) {
      setSaved(!next);
      setCount((c) => c + (next ? -1 : 1));
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="player">
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        aria-pressed={saved}
      >
        {saved ? "Überspielt" : "Überspielen"}
      </button>
      {label && <span className="muted">{label}</span>}
      {error && <span role="alert">{error}</span>}
    </div>
  );
}

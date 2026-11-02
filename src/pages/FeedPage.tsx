import { useEffect, useState } from "react";
import { Link } from "react-router";
import { HintSheet } from "../components/HintSheet";
import { MenuSheet } from "../components/MenuSheet";
import { PickCard } from "../components/PickCard";
import { useAuth } from "../hooks/useAuth";
import { useHint } from "../hooks/useHint";
import { hasUnseenRelease } from "../lib/changelog";
import { ALL_STEPS } from "../lib/hints";
import { getPhotoUrls } from "../lib/photos";
import { fetchFeed, hasPickedThisWeek } from "../lib/picks";
import type { Pick } from "../types";

export default function FeedPage() {
  const { profile } = useAuth();
  const [picks, setPicks] = useState<Pick[] | null>(null);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [pickedThisWeek, setPickedThisWeek] = useState(false);
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  // Beim ersten Öffnen, also auch direkt nach der Registrierung, kommt die Begrüßung.
  const welcome = useHint("welcome", profile?.id);
  const [unseenRelease] = useState(hasUnseenRelease);

  useEffect(() => {
    if (!profile) return;

    async function load(userId: string) {
      try {
        const [feed, picked] = await Promise.all([
          fetchFeed(),
          hasPickedThisWeek(userId),
        ]);
        const paths = feed
          .map((pick) => pick.photo_path)
          .filter((path): path is string => path !== null);
        setPhotoUrls(await getPhotoUrls(paths));
        setPicks(feed);
        setPickedThisWeek(picked);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Etwas ist schiefgelaufen.",
        );
      }
    }

    load(profile.id);
  }, [profile]);

  // Erst nach dem Laden zeigen, sonst blitzt der Knopf auch bei schon gepostetem Pick kurz auf.
  const showPostButton = picks !== null && !pickedThisWeek;

  return (
    <main className={showPostButton ? "has-fab" : undefined}>
      <header className="topbar">
        <h1>Tapetausch</h1>
        <button
          type="button"
          className="small"
          onClick={() => setMenuOpen(true)}
        >
          Menü
        </button>
      </header>

      <p className="greeting muted">
        Hallo {profile?.username}
        {pickedThisWeek && " · Dein Pick dieser Woche ist online ✓"}
      </p>

      {error && <p role="alert">{error}</p>}
      {!picks && !error && <p className="muted">Lädt …</p>}
      {picks?.length === 0 && (
        <p className="muted">Noch keine Picks. Mach den Anfang.</p>
      )}

      {picks?.map((pick) => (
        <PickCard
          key={pick.id}
          pick={pick}
          photoUrl={pick.photo_path ? photoUrls[pick.photo_path] : undefined}
          showDetailLink
        />
      ))}

      {showPostButton && (
        <Link className="button primary fab" to="/new">
          + Pick der Woche posten
        </Link>
      )}

      {menuOpen && (
        <MenuSheet
          username={profile?.username}
          onGuide={() => {
            setMenuOpen(false);
            setGuideOpen(true);
          }}
          onClose={() => setMenuOpen(false)}
        />
      )}
      {guideOpen && (
        <HintSheet steps={ALL_STEPS} onClose={() => setGuideOpen(false)} />
      )}
      {welcome.open && (
        <HintSheet steps={welcome.steps} onClose={welcome.close} />
      )}

      <footer className="app-footer">
        v{__APP_VERSION__} ·{" "}
        <Link to="/changelog">
          Was ist neu?
          {unseenRelease && <span className="new-dot" aria-label="neu" />}
        </Link>
      </footer>
    </main>
  );
}

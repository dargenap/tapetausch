import { useState } from "react";
import { NavLink, useLocation } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { useSwipeNav } from "../hooks/useSwipeNav";
import { ALL_STEPS } from "../lib/hints";
import { HintSheet } from "./HintSheet";
import { MenuSheet } from "./MenuSheet";

// Kopf von Feed und Sammlung: Titel, Menü und Umschalter zwischen beiden Seiten.
export function AppHeader() {
  const { profile } = useAuth();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);

  const onCollection = pathname === "/sammlung";
  useSwipeNav(onCollection ? null : "/sammlung", onCollection ? "/" : null);

  return (
    <>
      <header className="topbar">
        <h1>Tapetausch</h1>
        <button
          type="button"
          className="small"
          onClick={() => setMenuOpen(true)}
        >
          Menü
        </button>
        {/* replace, damit „Zurück“ nicht zwischen den Tabs pendelt. */}
        <nav className="tabs">
          <NavLink to="/" end replace>
            Feed
          </NavLink>
          <NavLink to="/sammlung" replace>
            Sammlung
          </NavLink>
        </nav>
      </header>

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
    </>
  );
}

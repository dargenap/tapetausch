import { useEffect } from "react";
import { useNavigate } from "react-router";

const MIN_DISTANCE = 70;
// Am Rand liegt auf iOS die Zurück-Geste des Browsers.
const EDGE = 24;

// Wischen nach links oder rechts führt zur angegebenen Seite.
// Reagiert nur auf Touch, am Desktop wechselt man per Klick.
export function useSwipeNav(left: string | null, right: string | null) {
  const navigate = useNavigate();

  useEffect(() => {
    let start: { x: number; y: number } | null = null;

    function onStart(event: TouchEvent) {
      const touch = event.touches[0];
      const target = event.target as Element | null;
      const ignored =
        event.touches.length !== 1 ||
        touch.clientX < EDGE ||
        touch.clientX > window.innerWidth - EDGE ||
        Boolean(target?.closest("input, textarea, .sheet"));
      start = ignored ? null : { x: touch.clientX, y: touch.clientY };
    }

    function onEnd(event: TouchEvent) {
      if (!start) return;
      const touch = event.changedTouches[0];
      const dx = touch.clientX - start.x;
      const dy = touch.clientY - start.y;
      start = null;

      // Nur klar waagerechte Gesten, sonst stört es beim Scrollen.
      if (Math.abs(dx) < MIN_DISTANCE || Math.abs(dx) < 2 * Math.abs(dy)) {
        return;
      }
      const path = dx < 0 ? left : right;
      if (path) navigate(path, { replace: true });
    }

    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchend", onEnd);
    };
  }, [left, right, navigate]);
}

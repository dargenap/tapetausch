import { useCallback, useState } from 'react';
import { HINTS, hasSeenHint, markHintSeen, type HintId } from '../lib/hints';

// Zeigt einen Hinweis einmalig, sobald active wahr ist, z. B. wenn ein Song ausgewählt wurde.
// Ohne scope (Profil noch nicht geladen) bleibt er zu.
export function useHint(id: HintId, scope: string | undefined, active = true) {
  const [closed, setClosed] = useState(false);
  const open = active && Boolean(scope) && !closed && !hasSeenHint(id, scope!);

  const close = useCallback(() => {
    if (scope) markHintSeen(id, scope);
    setClosed(true);
  }, [id, scope]);

  return { open, close, steps: HINTS[id] };
}

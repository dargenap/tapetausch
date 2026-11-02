import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { fetchPreviewUrl } from '../lib/itunes';

export type PlayerStatus = 'idle' | 'loading' | 'playing' | 'unavailable' | 'error';

type PlayerState = {
  trackId: number | null;
  status: PlayerStatus;
  seconds: number;
  volume: number;
};

const VOLUME_KEY = 'preview-volume';

// Gemerkte Lautstärke von 0 bis 1. localStorage kann im privaten Modus fehlen oder werfen.
function loadVolume() {
  try {
    const saved = Number(localStorage.getItem(VOLUME_KEY) ?? 1);
    return saved >= 0 && saved <= 1 ? saved : 1;
  } catch {
    return 1;
  }
}

// Ein Audio-Element und ein Zustand für die ganze App. So läuft immer nur eine Hörprobe.
const audio = new Audio();
audio.volume = loadVolume();
let state: PlayerState = { trackId: null, status: 'idle', seconds: 0, volume: audio.volume };
const listeners = new Set<() => void>();

function setState(next: Partial<PlayerState>) {
  state = { ...state, ...next };
  listeners.forEach(listener => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return state;
}

audio.addEventListener('playing', () => setState({ status: 'playing' }));
audio.addEventListener('timeupdate', () => setState({ seconds: audio.currentTime }));
audio.addEventListener('pause', () => {
  if (state.status === 'playing') setState({ status: 'idle' });
});
audio.addEventListener('ended', () => setState({ status: 'idle', seconds: 0 }));
audio.addEventListener('error', () => {
  if (state.status === 'loading' || state.status === 'playing') setState({ status: 'error' });
});

async function play() {
  try {
    await audio.play();
  } catch (err) {
    // AbortError heißt nur, dass inzwischen gestoppt oder gewechselt wurde.
    if (err instanceof DOMException && err.name === 'AbortError') return;
    setState({ status: 'error' });
  }
}

// Gilt für alle Hörproben. Auf iPhones ignoriert der Browser das, dort zählen die Tasten am Gerät.
export function setPreviewVolume(volume: number) {
  audio.volume = volume;
  setState({ volume });
  try {
    localStorage.setItem(VOLUME_KEY, String(volume));
  } catch {
    // Dann gilt die Lautstärke eben nur bis zum Neuladen.
  }
}

export function stopPreview() {
  audio.pause();
  if (state.status === 'loading' || state.status === 'playing') setState({ status: 'idle' });
}

// knownPreviewUrl: undefined heißt "noch unbekannt, bei Apple nachfragen",
// null heißt "Apple hat keine Hörprobe für diesen Song".
export function usePreviewPlayer(trackId: number, knownPreviewUrl?: string | null) {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot);
  const isMine = snapshot.trackId === trackId;

  const toggle = useCallback(async () => {
    if (state.trackId === trackId) {
      if (state.status === 'playing' || state.status === 'loading') {
        stopPreview();
        return;
      }
      if (state.status === 'idle' && audio.src) {
        await play();
        return;
      }
    }

    audio.pause();
    setState({ trackId, status: 'loading', seconds: 0 });

    let url = knownPreviewUrl;
    if (url === undefined) {
      try {
        url = await fetchPreviewUrl(trackId);
      } catch {
        if (state.trackId === trackId) setState({ status: 'error' });
        return;
      }
    }

    // In der Zwischenzeit wurde gestoppt oder ein anderer Song gestartet.
    if (state.trackId !== trackId || state.status !== 'loading') return;

    if (!url) {
      setState({ status: 'unavailable' });
      return;
    }

    audio.src = url;
    await play();
  }, [trackId, knownPreviewUrl]);

  // Verschwindet der Player, während sein Song läuft, wird die Hörprobe gestoppt.
  useEffect(() => {
    return () => {
      if (state.trackId === trackId) stopPreview();
    };
  }, [trackId]);

  return {
    status: isMine ? snapshot.status : 'idle',
    seconds: isMine ? snapshot.seconds : 0,
    volume: snapshot.volume,
    toggle,
  };
}

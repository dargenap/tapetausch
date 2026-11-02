import type { Track } from '../types';

const API = 'https://itunes.apple.com';
const COUNTRY = 'DE';

// So liefert Apple die Daten. Außerhalb dieser Datei wird nur Track verwendet.
type ItunesResult = {
  trackId: number;
  trackName: string;
  artistName: string;
  artworkUrl100?: string;
  trackViewUrl: string;
  previewUrl?: string;
};

type ItunesResponse = {
  resultCount: number;
  results: ItunesResult[];
};

function toTrack(item: ItunesResult): Track {
  return {
    trackId: item.trackId,
    title: item.trackName,
    artist: item.artistName,
    // Inoffizieller Trick für ein größeres Cover. Klappt er nicht, bleibt das kleine Bild.
    artworkUrl: item.artworkUrl100?.replace('100x100', '600x600') ?? '',
    trackUrl: item.trackViewUrl,
    previewUrl: item.previewUrl ?? null,
  };
}

async function request(path: string, params: Record<string, string>, signal?: AbortSignal) {
  const query = new URLSearchParams({ ...params, country: COUNTRY });
  let response: Response;

  try {
    response = await fetch(`${API}/${path}?${query}`, { signal });
  } catch (err) {
    // Ein bewusster Abbruch wird unverändert weitergegeben, alles andere ist ein Verbindungsproblem.
    if (signal?.aborted) throw err;
    throw new Error('Keine Verbindung zur Musiksuche. Prüfe deine Internetverbindung.');
  }

  if (response.status === 403 || response.status === 429) {
    throw new Error('Zu viele Suchen auf einmal. Warte kurz und versuche es noch einmal.');
  }
  if (!response.ok) {
    throw new Error('Die Musiksuche ist gerade nicht erreichbar.');
  }

  const data: ItunesResponse = await response.json();
  return data;
}

export async function searchTracks(term: string, signal?: AbortSignal): Promise<Track[]> {
  const data = await request(
    'search',
    { term, media: 'music', entity: 'song', limit: '15' },
    signal,
  );
  return data.results.map(toTrack);
}

// Holt den Link zur Hörprobe immer frisch, gespeichert wird er nie.
export async function fetchPreviewUrl(trackId: number): Promise<string | null> {
  const data = await request('lookup', { id: String(trackId) });
  return data.results[0]?.previewUrl ?? null;
}

import { useEffect, useState } from "react";
import { searchTracks } from "../lib/itunes";
import type { Track } from "../types";
import { PlayerControls } from "./PlayerControls";

const MIN_LENGTH = 2;
const DELAY_MS = 400;

type SearchStatus = "idle" | "loading" | "done" | "error";

type Props = {
  onSelect: (track: Track) => void;
};

export function SongSearch({ onSelect }: Props) {
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<Track[]>([]);
  const [status, setStatus] = useState<SearchStatus>("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    const query = term.trim();
    if (query.length < MIN_LENGTH) {
      setResults([]);
      setStatus("idle");
      return;
    }

    // Erst nach einer Tipp-Pause suchen und veraltete Anfragen abbrechen.
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setStatus("loading");
      try {
        const tracks = await searchTracks(query, controller.signal);
        setResults(tracks);
        setStatus("done");
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(
          err instanceof Error ? err.message : "Die Suche hat nicht geklappt.",
        );
        setStatus("error");
      }
    }, DELAY_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [term]);

  return (
    <div className="song-search">
      <label htmlFor="song-search">Song suchen</label>
      <input
        id="song-search"
        type="search"
        value={term}
        onChange={(event) => setTerm(event.target.value)}
        placeholder="Song oder Künstler"
        autoComplete="off"
      />

      {status === "loading" && <p>Suche läuft …</p>}
      {status === "error" && <p role="alert">{error}</p>}
      {status === "done" && results.length === 0 && <p>Keine Treffer.</p>}

      <ul>
        {results.map((track) => (
          <li key={track.trackId}>
            <img
              src={track.artworkUrl}
              alt=""
              width={60}
              height={60}
              loading="lazy"
            />
            <div>
              <strong>{track.title}</strong>
              <br />
              <span>{track.artist}</span>
            </div>
            <PlayerControls
              trackId={track.trackId}
              title={track.title}
              trackUrl={track.trackUrl}
              previewUrl={track.previewUrl}
            />
            <button type="button" onClick={() => onSelect(track)}>
              Auswählen
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

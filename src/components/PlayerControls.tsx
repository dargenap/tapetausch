import { setPreviewVolume, usePreviewPlayer, type PlayerStatus } from '../hooks/usePreviewPlayer';
import { formatSeconds } from '../lib/format';

const PREVIEW_SECONDS = 30;

const BUTTON_LABELS: Record<PlayerStatus, string> = {
  idle: 'Hörprobe',
  loading: 'Lädt …',
  playing: 'Stopp',
  error: 'Erneut versuchen',
  unavailable: '',
};

type Props = {
  trackId: number;
  title: string;
  trackUrl: string;
  previewUrl?: string | null;
};

export function PlayerControls({ trackId, title, trackUrl, previewUrl }: Props) {
  const { status, seconds, volume, toggle } = usePreviewPlayer(trackId, previewUrl);
  const label = BUTTON_LABELS[status];

  return (
    <div className="player">
      {status === 'unavailable' ? (
        <span>Keine Hörprobe</span>
      ) : (
        <>
          <button type="button" className="small" onClick={toggle} aria-label={`${label}: ${title}`}>
            {status === 'playing' ? '■' : '▶'} {label}
          </button>
          {status !== 'error' && (
            <span className="player-counter">
              {formatSeconds(seconds)} / {formatSeconds(PREVIEW_SECONDS)}
            </span>
          )}
          {/* Nur am Desktop sichtbar, siehe .volume in styles.css. */}
          <span className="volume">
            <span aria-hidden="true">{volume === 0 ? '🔇' : '🔊'}</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={event => setPreviewVolume(Number(event.target.value))}
              aria-label="Lautstärke"
            />
          </span>
        </>
      )}

      {/* Apple verlangt den Verweis auf den Store neben dem Player. */}
      <a href={trackUrl} target="_blank" rel="noopener noreferrer">
        Apple Music
      </a>
    </div>
  );
}

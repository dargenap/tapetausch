import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { HintSheet } from '../components/HintSheet';
import { RatingFaders } from '../components/RatingFaders';
import { SongSearch } from '../components/SongSearch';
import { useAuth } from '../hooks/useAuth';
import { useHint } from '../hooks/useHint';
import { stopPreview } from '../hooks/usePreviewPlayer';
import { uploadPhoto } from '../lib/photos';
import { createPick, hasPickedThisWeek } from '../lib/picks';
import type { Track } from '../types';

export default function NewPickPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [alreadyPicked, setAlreadyPicked] = useState<boolean | null>(null);
  const [track, setTrack] = useState<Track | null>(null);
  const [quality, setQuality] = useState(5);
  const [emotion, setEmotion] = useState(5);
  const [note, setNote] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const searchHint = useHint('search', profile?.id, alreadyPicked === false && !track);
  const postHint = useHint('post', profile?.id, Boolean(track));

  useEffect(() => {
    if (profile) hasPickedThisWeek(profile.id).then(setAlreadyPicked).catch(() => setAlreadyPicked(false));
  }, [profile]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile || !track) return;

    setBusy(true);
    setError('');
    try {
      const photoPath = photo ? await uploadPhoto(profile.id, photo) : null;
      const pickId = await createPick({ track, note, photoPath, quality, emotion });
      stopPreview();
      navigate(`/pick/${pickId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Etwas ist schiefgelaufen.');
      setBusy(false);
    }
  }

  if (alreadyPicked === null) return <main><p className="muted">Lädt …</p></main>;

  if (alreadyPicked) {
    return (
      <main>
        <h1>Pick der Woche</h1>
        <p>Du hast diese Woche schon einen Pick gepostet. Ab Montag geht es weiter.</p>
        <Link className="button primary block" to="/">
          Zurück zum Feed
        </Link>
      </main>
    );
  }

  return (
    <main>
      <Link className="back" to="/">
        ← Zurück
      </Link>
      <h1>Pick der Woche</h1>

      {!track ? (
        <SongSearch onSelect={setTrack} />
      ) : (
        <form className="card" onSubmit={handleSubmit}>
          <div className="track">
            {track.artworkUrl && <img className="artwork" src={track.artworkUrl} alt="" width={72} height={72} />}
            <div className="track-info">
              <strong className="track-title">{track.title}</strong>
              <span className="track-artist">{track.artist}</span>
              <button type="button" className="text-button" onClick={() => setTrack(null)} disabled={busy}>
                Anderen Song wählen
              </button>
            </div>
          </div>

          <h2 className="form-step">Deine Wertung</h2>

          <RatingFaders
            quality={quality}
            emotion={emotion}
            onChange={(nextQuality, nextEmotion) => {
              setQuality(nextQuality);
              setEmotion(nextEmotion);
            }}
          />

          <h2 className="form-step">Dein Moment</h2>
          <label htmlFor="note">Moment und Gefühl (optional)</label>
          <textarea
            id="note"
            value={note}
            onChange={event => setNote(event.target.value)}
            maxLength={1000}
            rows={4}
            placeholder="Wo hast du den Song gehört, wie fühlt er sich an?"
          />

          <label htmlFor="photo">Foto (optional)</label>
          <input
            id="photo"
            type="file"
            accept="image/*"
            onChange={event => setPhoto(event.target.files?.[0] ?? null)}
          />

          {error && <p role="alert">{error}</p>}
          <button type="submit" className="primary block" disabled={busy}>
            {busy ? 'Wird gepostet …' : 'Posten'}
          </button>
        </form>
      )}

      {searchHint.open && <HintSheet steps={searchHint.steps} onClose={searchHint.close} />}
      {postHint.open && <HintSheet steps={postHint.steps} onClose={postHint.close} />}
    </main>
  );
}

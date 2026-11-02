import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { formatAverage } from '../lib/format';
import { fetchRatings, submitRating } from '../lib/ratings';
import type { Rating } from '../types';
import { RatingFaders } from './RatingFaders';

type Props = {
  pickId: string;
  posterId: string;
};

export function BlindRating({ pickId, posterId }: Props) {
  const { profile } = useAuth();
  const [ratings, setRatings] = useState<Rating[] | null>(null);
  const [quality, setQuality] = useState(5);
  const [emotion, setEmotion] = useState(5);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchRatings(pickId)
      .then(setRatings)
      .catch(err => setError(err.message));
  }, [pickId]);

  async function handleSubmit() {
    setBusy(true);
    setError('');
    try {
      await submitRating(pickId, quality, emotion);
      setRatings(await fetchRatings(pickId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Etwas ist schiefgelaufen.');
    } finally {
      setBusy(false);
    }
  }

  if (!ratings) return <section>{error ? <p role="alert">{error}</p> : <p className="muted">Lädt …</p>}</section>;

  const hasRated = ratings.some(rating => rating.user_id === profile?.id);

  if (!hasRated) {
    return (
      <section>
        <h2>Deine Wertung</h2>
        <p className="muted">Die Wertungen der anderen siehst du nach deiner eigenen.</p>
        <RatingFaders
          quality={quality}
          emotion={emotion}
          onChange={(nextQuality, nextEmotion) => {
            setQuality(nextQuality);
            setEmotion(nextEmotion);
          }}
        />
        <button type="button" className="primary block" onClick={handleSubmit} disabled={busy}>
          Wertung abgeben
        </button>
        {error && <p role="alert">{error}</p>}
      </section>
    );
  }

  return (
    <section>
      <h2>Wertungen</h2>
      <div className="averages">
        <div className="average">
          <strong>{formatAverage(ratings.map(rating => rating.quality))}</strong>
          <span>Ø Qualität</span>
        </div>
        <div className="average">
          <strong>{formatAverage(ratings.map(rating => rating.emotion))}</strong>
          <span>Ø Emotion</span>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Qualität</th>
            <th>Emotion</th>
          </tr>
        </thead>
        <tbody>
          {ratings.map(rating => (
            <tr key={rating.user_id}>
              <td>
                {rating.author?.username ?? 'Unbekannt'}
                {rating.user_id === posterId && ' (Pick)'}
              </td>
              <td>{rating.quality}</td>
              <td>{rating.emotion}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

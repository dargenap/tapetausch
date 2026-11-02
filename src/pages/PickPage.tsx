import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { BlindRating } from '../components/BlindRating';
import { CommentSection } from '../components/CommentSection';
import { HintSheet } from '../components/HintSheet';
import { PickCard } from '../components/PickCard';
import { useAuth } from '../hooks/useAuth';
import { useHint } from '../hooks/useHint';
import { getPhotoUrls } from '../lib/photos';
import { deletePick, fetchPick } from '../lib/picks';
import type { Pick } from '../types';

export default function PickPage() {
  const { id } = useParams();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [pick, setPick] = useState<Pick | null | undefined>(undefined);
  const [photoUrl, setPhotoUrl] = useState<string>();
  const [error, setError] = useState('');
  const pickHint = useHint('pick', profile?.id, Boolean(pick) && pick?.user_id !== profile?.id);

  useEffect(() => {
    if (!id) return;

    async function load(pickId: string) {
      try {
        const loaded = await fetchPick(pickId);
        if (loaded?.photo_path) {
          const urls = await getPhotoUrls([loaded.photo_path]);
          setPhotoUrl(urls[loaded.photo_path]);
        }
        setPick(loaded);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Etwas ist schiefgelaufen.');
      }
    }

    load(id);
  }, [id]);

  async function handleDelete() {
    if (!pick || !window.confirm('Pick wirklich löschen? Wertungen und Kommentare gehen dabei verloren.')) return;
    try {
      await deletePick(pick);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Etwas ist schiefgelaufen.');
    }
  }

  return (
    <main>
      <Link className="back" to="/">
        ← Zurück zum Feed
      </Link>
      {error && <p role="alert">{error}</p>}
      {pick === undefined && !error && <p className="muted">Lädt …</p>}
      {pick === null && <p>Diesen Pick gibt es nicht mehr.</p>}

      {pick && (
        <>
          <PickCard pick={pick} photoUrl={photoUrl} />
          <BlindRating pickId={pick.id} posterId={pick.user_id} />
          <CommentSection pickId={pick.id} posterId={pick.user_id} />
          {pick.user_id === profile?.id && (
            <button type="button" className="text-button danger" onClick={handleDelete}>
              Pick löschen
            </button>
          )}
        </>
      )}

      {pickHint.open && <HintSheet steps={pickHint.steps} onClose={pickHint.close} />}
    </main>
  );
}

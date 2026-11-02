import { useNavigate } from 'react-router';
import { logout } from '../lib/auth';

type Props = {
  username: string | undefined;
  onGuide: () => void;
  onClose: () => void;
};

export function MenuSheet({ username, onGuide, onClose }: Props) {
  const navigate = useNavigate();

  return (
    <div className="sheet" role="dialog" aria-modal="true" aria-label="Menü" onClick={onClose}>
      {/* Klick neben das Blatt schließt es, Klicks im Blatt nicht. */}
      <div className="card" onClick={event => event.stopPropagation()}>
        <div className="menu-list">
          <button type="button" onClick={onGuide}>
            Anleitung
          </button>
          <button type="button" onClick={() => navigate('/feedback', { state: { from: '/' } })}>
            Feedback, Bug oder Wunsch
          </button>
          <button type="button" onClick={() => logout().catch(() => {})}>
            Abmelden
          </button>
        </div>
        <p className="muted menu-user">Angemeldet als {username}</p>
        <button type="button" className="text-button menu-close" onClick={onClose}>
          Schließen
        </button>
      </div>
    </div>
  );
}

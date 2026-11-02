import { useState, type FormEvent } from 'react';
import { Link, useLocation } from 'react-router';
import { sendFeedback, type FeedbackKind } from '../lib/feedback';

const KINDS: { value: FeedbackKind; label: string; placeholder: string }[] = [
  { value: 'bug', label: '🐞 Bug', placeholder: 'Was ist passiert und was hast du erwartet?' },
  { value: 'feedback', label: '💬 Feedback', placeholder: 'Was gefällt dir, was stört dich?' },
  { value: 'feature', label: '✨ Wunsch', placeholder: 'Was wünschst du dir?' },
];

export default function FeedbackPage() {
  const location = useLocation();
  const [kind, setKind] = useState<FeedbackKind>('bug');
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  // Von welcher Seite man kam, hilft bei Bugs.
  const from = (location.state as { from?: string } | null)?.from ?? null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!text.trim()) return;

    setBusy(true);
    setError('');
    try {
      await sendFeedback(kind, text, from);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Etwas ist schiefgelaufen.');
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <main>
        <h1>Danke!</h1>
        <p>Ist angekommen. Jede Rückmeldung hilft, Tapetausch besser zu machen.</p>
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
      <h1>Feedback</h1>
      <p className="muted">Bug gefunden, Idee oder Wunsch? Landet direkt beim Entwickler.</p>

      <form className="card" onSubmit={handleSubmit}>
        <div className="choice-group" role="radiogroup" aria-label="Art">
          {KINDS.map(option => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={kind === option.value}
              className={kind === option.value ? 'choice active' : 'choice'}
              onClick={() => setKind(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <label htmlFor="feedback-text">Deine Nachricht</label>
        <textarea
          id="feedback-text"
          value={text}
          onChange={event => setText(event.target.value)}
          maxLength={2000}
          rows={6}
          placeholder={KINDS.find(option => option.value === kind)?.placeholder}
        />
        <p className="muted small-print">Dein Username und dein Browser/Gerät werden mitgeschickt.</p>

        {error && <p role="alert">{error}</p>}
        <button type="submit" className="primary block" disabled={busy || !text.trim()}>
          {busy ? 'Wird gesendet …' : 'Senden'}
        </button>
      </form>
    </main>
  );
}

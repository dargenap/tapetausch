import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router';
import { HintSheet } from '../components/HintSheet';
import { useAuth } from '../hooks/useAuth';
import { useHint } from '../hooks/useHint';
import { login, register } from '../lib/auth';

type Mode = 'login' | 'register';

export default function LoginPage() {
  const { session, profile, loading, refreshProfile } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  // Vor dem Login gibt es keine Nutzer-ID, deshalb gilt der Hinweis pro Gerät.
  const registerHint = useHint('register', 'device', mode === 'register');

  // Wer schon Mitglied ist, braucht diese Seite nicht.
  // Das greift auch direkt nach erfolgreichem Login oder Registrieren.
  if (profile) return <Navigate to="/" replace />;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setBusy(true);

    try {
      if (mode === 'login') {
        await login(username, password);
      } else {
        await register(username, password, inviteCode);
        await refreshProfile();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Etwas ist schiefgelaufen.');
    } finally {
      setBusy(false);
    }
  }

  function switchMode() {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
  }

  // Eingeloggt, aber ohne Profil: Die Registrierung wurde abgebrochen.
  const missingProfile = Boolean(session) && !loading && !busy && !error;

  return (
    <main className="auth">
      <h1 className="brand">Tapetausch</h1>
      <p className="tagline muted">Jede Woche ein Song. Von jedem.</p>

      <form className="card" onSubmit={handleSubmit}>
        <h2>{mode === 'login' ? 'Anmelden' : 'Registrieren'}</h2>
        <label htmlFor="username">Username</label>
        <input
          id="username"
          value={username}
          onChange={event => setUsername(event.target.value)}
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          required
        />

        <label htmlFor="password">Passwort</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={event => setPassword(event.target.value)}
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          required
        />

        {mode === 'register' && (
          <>
            <label htmlFor="invite-code">Einladungscode</label>
            <input
              id="invite-code"
              value={inviteCode}
              onChange={event => setInviteCode(event.target.value)}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              required
            />
          </>
        )}

        {error && <p role="alert">{error}</p>}
        {missingProfile && (
          <p>
            Deine Registrierung wurde nicht abgeschlossen. Registriere dich noch einmal mit demselben
            Username, Passwort und Einladungscode.
          </p>
        )}

        <button type="submit" className="primary block" disabled={busy}>
          {busy ? 'Moment …' : mode === 'login' ? 'Anmelden' : 'Registrieren'}
        </button>
      </form>

      <button type="button" className="text-button switch" onClick={switchMode}>
        {mode === 'login' ? 'Noch kein Konto? Registrieren' : 'Schon registriert? Anmelden'}
      </button>

      {registerHint.open && <HintSheet steps={registerHint.steps} onClose={registerHint.close} />}
    </main>
  );
}

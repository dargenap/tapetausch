import { supabase } from './supabase';

const USERNAME_PATTERN = /^[A-Za-z0-9_]{3,20}$/;
const MIN_PASSWORD_LENGTH = 6;

// Schlüssel sind Fehlercodes von Supabase Auth oder Fehlertexte aus unseren SQL-Funktionen.
const MESSAGES: Record<string, string> = {
  invalid_invite: 'Der Einladungscode ist falsch.',
  username_taken: 'Dieser Username ist schon vergeben.',
  user_already_exists: 'Dieser Username ist schon vergeben.',
  already_registered: 'Du bist schon registriert. Melde dich einfach an.',
  invalid_credentials: 'Username oder Passwort ist falsch.',
  weak_password: `Das Passwort braucht mindestens ${MIN_PASSWORD_LENGTH} Zeichen.`,
  over_request_rate_limit: 'Zu viele Versuche. Warte kurz und probiere es noch einmal.',
};

const FALLBACK_MESSAGE = 'Etwas ist schiefgelaufen. Prüfe deine Internetverbindung und versuche es noch einmal.';

// Wandelt einen Supabase-Fehler in eine verständliche Meldung um und wirft sie.
function fail(error: { code?: string; message: string }): never {
  throw new Error(MESSAGES[error.code ?? ''] ?? MESSAGES[error.message] ?? FALLBACK_MESSAGE);
}

export function usernameToEmail(username: string) {
  return `${username.trim().toLowerCase()}@app.local`;
}

// Gibt eine Fehlermeldung zurück oder null, wenn der Username passt.
export function validateUsername(username: string): string | null {
  return USERNAME_PATTERN.test(username.trim())
    ? null
    : 'Der Username braucht 3 bis 20 Zeichen: Buchstaben, Ziffern oder Unterstrich.';
}

export async function register(username: string, password: string, inviteCode: string) {
  const name = username.trim();

  const problem = validateUsername(name);
  if (problem) throw new Error(problem);
  if (password.length < MIN_PASSWORD_LENGTH) throw new Error(MESSAGES.weak_password);

  // 1. Code prüfen, bevor ein Konto entsteht.
  const { data: valid, error: inviteError } = await supabase.rpc('check_invite', { p_code: inviteCode });
  if (inviteError) fail(inviteError);
  if (!valid) throw new Error(MESSAGES.invalid_invite);

  // 2. Konto anlegen. Ohne E-Mail-Bestätigung ist man danach direkt eingeloggt.
  const email = usernameToEmail(name);
  const { error: signUpError } = await supabase.auth.signUp({ email, password });

  if (signUpError) {
    if (signUpError.code !== 'user_already_exists') fail(signUpError);

    // Das Konto gibt es schon. Ist es ein abgebrochener eigener Versuch, passt das Passwort.
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) throw new Error(MESSAGES.user_already_exists);
  }

  // 3. Profil anlegen. Erst damit ist man Mitglied.
  const { error: profileError } = await supabase.rpc('create_profile', {
    p_username: name,
    p_code: inviteCode,
  });
  if (profileError) fail(profileError);
}

export async function login(username: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({
    email: usernameToEmail(username),
    password,
  });
  if (error) fail(error);
}

export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) fail(error);
}

import { createClient } from "@supabase/supabase-js";

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;
const domain = process.env.AUTH_TEST_DOMAIN ?? "app.local";

if (!url || !key) {
  throw new Error(
    "VITE_SUPABASE_URL oder VITE_SUPABASE_ANON_KEY fehlt in .env.local",
  );
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const email = `test_${Date.now()}@${domain}`;
const password = "Test-Passwort-123";
let failed = 0;

function report(name: string, ok: boolean, detail = "") {
  if (!ok) failed++;
  console.log(
    `${ok ? "OK    " : "FEHLER"} ${name}${detail ? `: ${detail}` : ""}`,
  );
}

function describe(error: { code?: string; message: string } | null) {
  return error ? `${error.code ?? "ohne Code"}, ${error.message}` : "";
}

async function main() {
  console.log(`Testkonto: ${email}\n`);

  const signUp = await supabase.auth.signUp({ email, password });
  report("Registrierung", !signUp.error, describe(signUp.error));

  if (signUp.error) {
    console.log("\nAbbruch, weil die Registrierung fehlgeschlagen ist.");
    process.exitCode = 1;
    return;
  }

  report(
    "Direkte Sitzung ohne E-Mail-Bestätigung",
    Boolean(signUp.data.session),
    signUp.data.session
      ? ""
      : "keine Sitzung, Confirm email ist vermutlich noch an",
  );

  await supabase.auth.signOut();

  const signIn = await supabase.auth.signInWithPassword({ email, password });
  report(
    "Login mit richtigem Passwort",
    Boolean(signIn.data.session),
    describe(signIn.error),
  );
  await supabase.auth.signOut();

  const wrongPassword = await supabase.auth.signInWithPassword({
    email,
    password: "falsches-Passwort",
  });
  report(
    "Login mit falschem Passwort wird abgelehnt",
    Boolean(wrongPassword.error),
  );

  const duplicate = await supabase.auth.signUp({ email, password });
  report(
    "Doppelte Registrierung wird abgelehnt",
    Boolean(duplicate.error),
    describe(duplicate.error),
  );
  await supabase.auth.signOut();

  console.log(
    failed === 0
      ? "\nAlle Prüfungen bestanden."
      : `\n${failed} Prüfung(en) fehlgeschlagen.`,
  );
  process.exitCode = failed === 0 ? 0 : 1;
}

main();

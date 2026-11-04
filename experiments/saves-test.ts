import { createClient } from "@supabase/supabase-js";

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;
const code = process.env.TEST_INVITE_CODE;

if (!url || !key || !code) {
  throw new Error(
    "VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY oder TEST_INVITE_CODE fehlt in .env.local",
  );
}

const makeClient = () =>
  createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

type Client = ReturnType<typeof makeClient>;
type Result = {
  data: unknown;
  error: { code?: string; message: string } | null;
};

const stamp = Date.now();
const nameA = `sa${stamp}`;
const nameB = `sb${stamp}`;
const nameC = `sc${stamp}`;
const password = "Test-Passwort-123";
// Wie PICK_FIELDS in src/lib/picks.ts.
const pickFields =
  "*, author:profiles!picks_user_id_fkey(username), saves(user_id)";
let failed = 0;

function report(name: string, ok: boolean, detail = "") {
  if (!ok) failed++;
  console.log(
    `${ok ? "OK    " : "FEHLER"} ${name}${detail ? `: ${detail}` : ""}`,
  );
}

function describe(error: Result["error"]) {
  return error ? `${error.code ?? "ohne Code"}, ${error.message}` : "";
}

function rows(result: Result) {
  return Array.isArray(result.data) ? result.data.length : 0;
}

// Gibt Zeilenzahl und, falls vorhanden, den Fehler aus.
function detail(result: Result) {
  return result.error ? describe(result.error) : `${rows(result)} Zeile(n)`;
}

async function signUpUser(client: Client, name: string) {
  const { data, error } = await client.auth.signUp({
    email: `${name}@app.local`,
    password,
  });
  if (error || !data.session || !data.user) {
    throw new Error(
      `Registrierung von ${name} fehlgeschlagen: ${error?.message ?? "keine Sitzung"}`,
    );
  }
  return data.user.id;
}

async function createProfile(client: Client, name: string) {
  const { error } = await client.rpc("create_profile", {
    p_username: name,
    p_code: code,
  });
  if (error) {
    throw new Error(`Profil für ${name} fehlgeschlagen: ${error.message}`);
  }
}

function createPick(client: Client) {
  return client.rpc("create_pick", {
    p_itunes_track_id: 123456789,
    p_title: "Testsong",
    p_artist: "Testkünstler",
    p_artwork_url: null,
    p_track_url: null,
    p_note: "Testnotiz",
    p_photo_path: null,
    p_quality: 7,
    p_emotion: 7,
  });
}

async function main() {
  const anon = makeClient();
  const a = makeClient();
  const b = makeClient();
  const c = makeClient();

  console.log(`Konten: ${nameA}, ${nameB}, ${nameC}\n`);
  console.log("Konten anlegen");
  const idA = await signUpUser(a, nameA);
  const idB = await signUpUser(b, nameB);
  await signUpUser(c, nameC);
  await createProfile(a, nameA);
  await createProfile(b, nameB);
  report("A und B sind Mitglieder, C hat kein Profil", true);

  const pickA = await createPick(a);
  const pickId = typeof pickA.data === "string" ? pickA.data : "";
  report(
    "A postet einen Pick",
    !pickA.error && Boolean(pickId),
    describe(pickA.error),
  );
  if (!pickId) {
    process.exitCode = 1;
    return;
  }

  console.log("\nÜberspielen");
  const saveB = await b.from("saves").insert({ pick_id: pickId });
  report("B überspielt den Pick von A", !saveB.error, describe(saveB.error));

  const saveBTwice = await b.from("saves").insert({ pick_id: pickId });
  report(
    "Zweites Überspielen gibt 23505, das savePick ignoriert",
    saveBTwice.error?.code === "23505",
    describe(saveBTwice.error),
  );

  const saveOwn = await a.from("saves").insert({ pick_id: pickId });
  report(
    "A kann den eigenen Pick nicht überspielen",
    Boolean(saveOwn.error),
    describe(saveOwn.error),
  );

  const saveC = await c.from("saves").insert({ pick_id: pickId });
  report(
    "C ohne Profil kann nicht überspielen",
    Boolean(saveC.error),
    describe(saveC.error),
  );

  const fakeSave = await c
    .from("saves")
    .insert({ pick_id: pickId, user_id: idB });
  report(
    "C kann nicht im Namen von B überspielen",
    Boolean(fakeSave.error),
    describe(fakeSave.error),
  );

  const anonSaves = await anon.from("saves").select("*");
  report(
    "Ohne Anmeldung sind Speicherungen nicht lesbar",
    Boolean(anonSaves.error) || rows(anonSaves) === 0,
    detail(anonSaves),
  );

  console.log("\nZähler und Sammlung");
  const pickForA = await a
    .from("picks")
    .select(pickFields)
    .eq("id", pickId)
    .single();
  const saves = (pickForA.data as { saves?: { user_id: string }[] } | null)
    ?.saves;
  report(
    "A sieht am eigenen Pick genau eine Speicherung von B",
    saves?.length === 1 && saves[0].user_id === idB,
    pickForA.error ? describe(pickForA.error) : JSON.stringify(saves),
  );

  // Dieselbe Abfrage wie fetchCollection in src/lib/saves.ts.
  const collectionB = await b
    .from("saves")
    .select(`created_at, pick:picks(${pickFields})`)
    .eq("user_id", idB)
    .order("created_at", { ascending: false });
  const first = (
    collectionB.data as { pick?: { title?: string; author?: unknown } }[] | null
  )?.[0]?.pick;
  report(
    "Sammlung von B enthält den Pick als Objekt mit Titel und Autor",
    rows(collectionB) === 1 &&
      first?.title === "Testsong" &&
      Boolean(first.author),
    detail(collectionB),
  );

  const collectionA = await a.from("saves").select("pick_id").eq("user_id", idA);
  report(
    "Sammlung von A ist leer",
    !collectionA.error && rows(collectionA) === 0,
    detail(collectionA),
  );

  console.log("\nEntfernen");
  const deleteByA = await a
    .from("saves")
    .delete()
    .eq("pick_id", pickId)
    .select();
  report(
    "A kann die Speicherung von B nicht entfernen",
    Boolean(deleteByA.error) || rows(deleteByA) === 0,
    detail(deleteByA),
  );

  const deleteByB = await b
    .from("saves")
    .delete()
    .eq("pick_id", pickId)
    .select();
  report(
    "B entfernt die Speicherung wieder",
    !deleteByB.error && rows(deleteByB) === 1,
    detail(deleteByB),
  );

  const resave = await b.from("saves").insert({ pick_id: pickId });
  report("B überspielt erneut", !resave.error, describe(resave.error));

  const deletePick = await a.from("picks").delete().eq("id", pickId).select();
  report(
    "A löscht seinen Pick",
    !deletePick.error && rows(deletePick) === 1,
    detail(deletePick),
  );

  const afterDelete = await b.from("saves").select("*").eq("user_id", idB);
  report(
    "Die Speicherung ist mitgelöscht",
    !afterDelete.error && rows(afterDelete) === 0,
    detail(afterDelete),
  );

  console.log(
    failed === 0
      ? "\nAlle Prüfungen bestanden."
      : `\n${failed} Prüfung(en) fehlgeschlagen.`,
  );
  console.log(
    "Lösche die Testkonten danach unter Authentication, Users. Profile, Picks und Speicherungen verschwinden mit.",
  );
  process.exitCode = failed === 0 ? 0 : 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

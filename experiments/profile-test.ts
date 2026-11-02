import { randomUUID } from "node:crypto";
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
const nameA = `ta${stamp}`;
const nameB = `tb${stamp}`;
const nameC = `tc${stamp}`;
const password = "Test-Passwort-123";
const bucket = "pick-photos";
// Ein 1x1-Pixel großes JPEG als Testbild.
const testImage = Buffer.from(
  "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwBtFFFecfQH/9k=",
  "base64",
);
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

function hasMessage(error: Result["error"], text: string) {
  return Boolean(error?.message.includes(text));
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

function createPick(client: Client, quality: number, emotion: number) {
  return client.rpc("create_pick", {
    p_itunes_track_id: 123456789,
    p_title: "Testsong",
    p_artist: "Testkünstler",
    p_artwork_url: null,
    p_track_url: null,
    p_note: "Testnotiz",
    p_photo_path: null,
    p_quality: quality,
    p_emotion: emotion,
  });
}

async function main() {
  const anon = makeClient();
  const a = makeClient();
  const b = makeClient();
  const c = makeClient();

  console.log(`Konten: ${nameA}, ${nameB}, ${nameC}\n`);
  console.log("Ohne Anmeldung");

  const wrongCode = await anon.rpc("check_invite", { p_code: "falscher-code" });
  report(
    "check_invite mit falschem Code gibt false",
    !wrongCode.error && wrongCode.data === false,
    describe(wrongCode.error),
  );

  const rightCode = await anon.rpc("check_invite", { p_code: code });
  report(
    "check_invite mit richtigem Code gibt true",
    !rightCode.error && rightCode.data === true,
    describe(rightCode.error),
  );

  const anonCreate = await anon.rpc("create_profile", {
    p_username: nameA,
    p_code: code,
  });
  report(
    "create_profile wird abgelehnt",
    Boolean(anonCreate.error),
    describe(anonCreate.error),
  );

  const anonRead = await anon.from("profiles").select("*");
  report(
    "profiles ist nicht lesbar",
    Boolean(anonRead.error) || rows(anonRead) === 0,
    detail(anonRead),
  );

  console.log("\nKonten anlegen");
  const idA = await signUpUser(a, nameA);
  const idB = await signUpUser(b, nameB);
  const idC = await signUpUser(c, nameC);
  report("Konten A, B und C angelegt", true);

  console.log("\nKonto A");
  const badInvite = await a.rpc("create_profile", {
    p_username: nameA,
    p_code: "falscher-code",
  });
  report(
    "create_profile mit falschem Code wird abgelehnt",
    hasMessage(badInvite.error, "invalid_invite"),
    describe(badInvite.error),
  );

  const createA = await a.rpc("create_profile", {
    p_username: nameA,
    p_code: code,
  });
  report(
    "create_profile mit richtigem Code klappt",
    !createA.error,
    describe(createA.error),
  );

  const readA = await a.from("profiles").select("*");
  report(
    "A sieht genau sein eigenes Profil",
    !readA.error && rows(readA) === 1,
    detail(readA),
  );

  const settingsA = await a.from("invite_settings").select("*");
  report(
    "invite_settings ist nicht lesbar",
    Boolean(settingsA.error) || rows(settingsA) === 0,
    detail(settingsA),
  );

  const twice = await a.rpc("create_profile", {
    p_username: `${nameA}x`,
    p_code: code,
  });
  report(
    "Zweites Profil für A wird abgelehnt",
    hasMessage(twice.error, "already_registered"),
    describe(twice.error),
  );

  console.log("\nKonto B ohne Profil");
  const readBEarly = await b.from("profiles").select("*");
  report(
    "B sieht keine Profile",
    !readBEarly.error && rows(readBEarly) === 0,
    detail(readBEarly),
  );

  const directInsert = await b
    .from("profiles")
    .insert({ id: idB, username: nameB });
  report(
    "Direktes Einfügen in profiles wird abgelehnt",
    Boolean(directInsert.error),
    describe(directInsert.error),
  );

  const takenName = await b.rpc("create_profile", {
    p_username: nameA.toUpperCase(),
    p_code: code,
  });
  report(
    "Username von A in Großbuchstaben ist vergeben",
    hasMessage(takenName.error, "username_taken"),
    describe(takenName.error),
  );

  console.log("\nKonto B mit Profil");
  const createB = await b.rpc("create_profile", {
    p_username: nameB,
    p_code: code,
  });
  report(
    "create_profile für B klappt",
    !createB.error,
    describe(createB.error),
  );

  const readB = await b.from("profiles").select("*");
  report(
    "B sieht beide Profile",
    !readB.error && rows(readB) === 2,
    detail(readB),
  );

  const readALate = await a.from("profiles").select("*");
  report(
    "A sieht beide Profile",
    !readALate.error && rows(readALate) === 2,
    detail(readALate),
  );

  console.log("\nPicks");
  const pickC = await createPick(c, 5, 5);
  report(
    "C ohne Profil kann nicht posten",
    hasMessage(pickC.error, "not_member"),
    describe(pickC.error),
  );

  const pickInvalid = await createPick(a, 11, 5);
  report(
    "Wertung 11 wird abgelehnt",
    Boolean(pickInvalid.error),
    describe(pickInvalid.error),
  );

  const afterInvalid = await a.from("picks").select("*");
  report(
    "Abgelehnter Pick wurde nicht gespeichert",
    !afterInvalid.error && rows(afterInvalid) === 0,
    detail(afterInvalid),
  );

  const pickA = await createPick(a, 8, 10);
  const pickId = typeof pickA.data === "string" ? pickA.data : "";
  report(
    "A postet einen Pick",
    !pickA.error && Boolean(pickId),
    describe(pickA.error),
  );

  const weekA = await a
    .from("picks")
    .select("week_start")
    .eq("id", pickId)
    .single();
  const weekStart =
    (weekA.data as { week_start?: string } | null)?.week_start ?? "";
  report(
    "week_start ist ein Montag",
    new Date(`${weekStart}T00:00:00Z`).getUTCDay() === 1,
    weekStart || describe(weekA.error),
  );

  const pickTwice = await createPick(a, 5, 5);
  report(
    "Zweiter Pick derselben Woche wird abgelehnt",
    hasMessage(pickTwice.error, "already_picked_this_week"),
    describe(pickTwice.error),
  );

  const directPick = await a
    .from("picks")
    .insert({ itunes_track_id: 1, title: "x", artist: "y" });
  report(
    "Direktes Einfügen in picks wird abgelehnt",
    Boolean(directPick.error),
    describe(directPick.error),
  );

  const picksB = await b.from("picks").select("*");
  report(
    "B sieht den Pick von A",
    !picksB.error && rows(picksB) === 1,
    detail(picksB),
  );

  const picksC = await c.from("picks").select("*");
  report(
    "C ohne Profil sieht keine Picks",
    Boolean(picksC.error) || rows(picksC) === 0,
    detail(picksC),
  );

  const picksAnon = await anon.from("picks").select("*");
  report(
    "Ohne Anmeldung keine Picks",
    Boolean(picksAnon.error) || rows(picksAnon) === 0,
    detail(picksAnon),
  );

  console.log("\nBlindbewertung");
  const ratingsA = await a.from("ratings").select("*");
  report(
    "A sieht seine eigene Wertung",
    !ratingsA.error && rows(ratingsA) === 1,
    detail(ratingsA),
  );

  const ratingsBEarly = await b.from("ratings").select("*");
  report(
    "B sieht vor der eigenen Wertung nichts",
    !ratingsBEarly.error && rows(ratingsBEarly) === 0,
    detail(ratingsBEarly),
  );

  const fakeRating = await b
    .from("ratings")
    .insert({ pick_id: pickId, user_id: idA, quality: 1, emotion: 1 });
  report(
    "B kann nicht im Namen von A werten",
    Boolean(fakeRating.error),
    describe(fakeRating.error),
  );

  const rateB = await b
    .from("ratings")
    .insert({ pick_id: pickId, quality: 7, emotion: 8 });
  report("B gibt eine Wertung ab", !rateB.error, describe(rateB.error));

  const rateBTwice = await b
    .from("ratings")
    .insert({ pick_id: pickId, quality: 6, emotion: 6 });
  report(
    "B kann nicht zweimal werten",
    Boolean(rateBTwice.error),
    describe(rateBTwice.error),
  );

  const ratingsBLate = await b.from("ratings").select("*");
  report(
    "B sieht danach beide Wertungen",
    !ratingsBLate.error && rows(ratingsBLate) === 2,
    detail(ratingsBLate),
  );

  const changeRating = await b
    .from("ratings")
    .update({ quality: 1 })
    .eq("pick_id", pickId);
  report(
    "Wertungen lassen sich nicht ändern",
    Boolean(changeRating.error),
    describe(changeRating.error),
  );

  console.log("\nLöschen");
  const deleteByB = await b.from("picks").delete().eq("id", pickId).select();
  report(
    "B kann den Pick von A nicht löschen",
    Boolean(deleteByB.error) || rows(deleteByB) === 0,
    detail(deleteByB),
  );

  const deleteByA = await a.from("picks").delete().eq("id", pickId).select();
  report(
    "A löscht seinen Pick",
    !deleteByA.error && rows(deleteByA) === 1,
    detail(deleteByA),
  );

  const ratingsAfterDelete = await b.from("ratings").select("*");
  report(
    "Die Wertungen sind mitgelöscht",
    !ratingsAfterDelete.error && rows(ratingsAfterDelete) === 0,
    detail(ratingsAfterDelete),
  );

  const pickAgain = await createPick(a, 6, 7);
  report(
    "Danach ist ein neuer Pick möglich",
    !pickAgain.error,
    describe(pickAgain.error),
  );

  console.log("\nFotos");
  const photoA = `${idA}/${randomUUID()}.jpg`;
  const uploadA = await a.storage
    .from(bucket)
    .upload(photoA, testImage, { contentType: "image/jpeg" });
  report(
    "A lädt ein Foto in den eigenen Ordner",
    !uploadA.error,
    describe(uploadA.error),
  );

  const uploadForeign = await a.storage
    .from(bucket)
    .upload(`${idB}/${randomUUID()}.jpg`, testImage, {
      contentType: "image/jpeg",
    });
  report(
    "A kann nicht in den Ordner von B hochladen",
    Boolean(uploadForeign.error),
    describe(uploadForeign.error),
  );

  const uploadC = await c.storage
    .from(bucket)
    .upload(`${idC}/${randomUUID()}.jpg`, testImage, {
      contentType: "image/jpeg",
    });
  report(
    "C ohne Profil kann nichts hochladen",
    Boolean(uploadC.error),
    describe(uploadC.error),
  );

  const uploadText = await a.storage
    .from(bucket)
    .upload(`${idA}/${randomUUID()}.txt`, Buffer.from("hallo"), {
      contentType: "text/plain",
    });
  report(
    "Textdateien werden abgelehnt",
    Boolean(uploadText.error),
    describe(uploadText.error),
  );

  const signedB = await b.storage.from(bucket).createSignedUrl(photoA, 60);
  const signedUrl = signedB.data?.signedUrl ?? "";
  report(
    "B erzeugt eine signierte URL für das Foto von A",
    !signedB.error && Boolean(signedUrl),
    describe(signedB.error),
  );

  if (signedUrl) {
    const download = await fetch(signedUrl);
    report(
      "Die signierte URL liefert das Bild aus",
      download.ok,
      `HTTP ${download.status}`,
    );
  }

  const signedC = await c.storage.from(bucket).createSignedUrl(photoA, 60);
  report(
    "C ohne Profil bekommt keine URL",
    Boolean(signedC.error),
    describe(signedC.error),
  );

  const signedAnon = await anon.storage
    .from(bucket)
    .createSignedUrl(photoA, 60);
  report(
    "Ohne Anmeldung keine URL",
    Boolean(signedAnon.error),
    describe(signedAnon.error),
  );

  const removeByB = await b.storage.from(bucket).remove([photoA]);
  report(
    "B kann das Foto von A nicht löschen",
    Boolean(removeByB.error) || rows(removeByB) === 0,
    detail(removeByB),
  );

  const removeByA = await a.storage.from(bucket).remove([photoA]);
  report(
    "A löscht sein Foto",
    !removeByA.error && rows(removeByA) === 1,
    detail(removeByA),
  );

  const signedAfter = await b.storage.from(bucket).createSignedUrl(photoA, 60);
  report(
    "Das Foto ist danach weg",
    Boolean(signedAfter.error),
    describe(signedAfter.error),
  );

  console.log(
    failed === 0
      ? "\nAlle Prüfungen bestanden."
      : `\n${failed} Prüfung(en) fehlgeschlagen.`,
  );
  console.log(
    "Lösche die Testkonten danach unter Authentication, Users. Profile, Picks und Wertungen verschwinden mit.",
  );
  process.exitCode = failed === 0 ? 0 : 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

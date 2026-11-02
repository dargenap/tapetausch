export type Step = {
  title: string;
  text: string;
  tip?: string;
};

export type HintId = 'register' | 'welcome' | 'search' | 'post' | 'pick';

// Kurze Erklärungen, die erscheinen, sobald man ein Feature zum ersten Mal öffnet.
// Texte und Tipps einfach hier ergänzen oder ändern.
export const HINTS: Record<HintId, Step[]> = {
  // Login-Seite, beim ersten Wechsel auf „Registrieren“
  register: [
    {
      title: 'Willkommen bei Tapetausch',
      text: 'Tapetausch ist privat. Zum Registrieren brauchst du einen Einladungscode, den bekommst du von der Person, die dich eingeladen hat. Username: 3 bis 20 Zeichen aus Buchstaben, Ziffern oder _. Passwort: mindestens 6 Zeichen.',
      tip: 'Merk dir Username und Passwort gut. Es gibt keine E-Mail, über die du dein Passwort zurücksetzen könntest.',
    },
  ],
  // Feed, beim ersten Öffnen, also direkt nach der Registrierung
  welcome: [
    {
      title: 'Willkommen bei Tapetausch',
      text: 'Jede Woche teilt jeder genau einen Song, der ihn gerade begleitet. Die anderen hören rein, bewerten und kommentieren. Ziel ist das Teilen von Musik, nicht das Bewerten selbst. ',
      tip: 'Diese Anleitung findest du jederzeit wieder im Menü oben rechts.',
    },
    {
      title: 'Dein Pick der Woche',
      text: 'Tippe unten auf „Pick der Woche posten“, such den Song und hör kurz rein. Ein Pick pro Woche, ab Montag gibt es einen neuen.',
      tip: 'Füge die App zum Homescreen hinzu, dann startet sie wie eine normale App.',
    },
  ],
  // Pick posten, solange die Song-Suche offen ist
  search: [
    {
      title: 'Song finden',
      text: 'Gib Titel oder Künstler ein. Mit ▶ hörst du 30 Sekunden rein, mit „Auswählen“ nimmst du den Song.',
      tip: 'Nimm den Song, der deine Woche wirklich geprägt hat. Ein alter Favorit ist genauso viel Wert wie deine neue Obsession.',
    },
  ],
  // Pick posten, sobald ein Song ausgewählt ist
  post: [
    {
      title: 'Qualität und Emotion',
      text: 'Zwei Regler von 1 bis 10: Qualität heißt, wie gut der Song gemacht ist. Emotion heißt, wie sehr er dich berührt. Beim Posten gibst du deine eigene Wertung ab.',
      tip: 'Ein Song darf handwerklich eine 4 und emotional eine 10 sein.',
    },
    {
      title: 'Moment und Foto',
      text: 'Schreib dazu, wo und wie du den Song gehört hast, bzw. wie er dich fühlen lässt. Hänge optional ein passendes Foto an.',
    },
  ],
  // Pick eines anderen Mitglieds, beim ersten Öffnen
  pick: [
    {
      title: 'Blind bewerten',
      text: 'Bei den Picks der anderen siehst du die Wertungen erst, nachdem du selbst bewertet hast. So beeinflusst sich niemand.',
      tip: 'Erst die ganze Hörprobe (30 Sekunden) anhören, dann bewerten. Bleibt nett und respektvoll, vor allem bei emotionaler Bewertung.',
    },
    {
      title: 'Kommentieren und antworten',
      text: 'Unten kommentierst du den Pick allgemein. Mit „Antworten“ unter einem Kommentar antwortest du direkt einer Person.',
    },
  ],
};

// Die ganze Anleitung am Stück, für „Anleitung“ im Menü.
export const ALL_STEPS: Step[] = [...HINTS.welcome, ...HINTS.search, ...HINTS.post, ...HINTS.pick];

// Gemerkt wird pro Gerät und Nutzer. Vor dem Login gibt es keine Nutzer-ID, dann gilt 'device'.
// localStorage kann im privaten Modus fehlen oder werfen, daher immer try/catch.
function storageKey(id: HintId, scope: string) {
  return `hint:${id}:${scope}`;
}

export function hasSeenHint(id: HintId, scope: string) {
  try {
    return localStorage.getItem(storageKey(id, scope)) === '1';
  } catch {
    return false;
  }
}

export function markHintSeen(id: HintId, scope: string) {
  try {
    localStorage.setItem(storageKey(id, scope), '1');
  } catch {
    // Dann kommt der Hinweis beim nächsten Mal eben noch einmal.
  }
}

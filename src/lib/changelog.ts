import data from '../changelog.json';

export type Release = {
  version: string;
  title: string;
  date?: string;
  changes: string[];
};

// Neueste Version zuerst. Pflege siehe README, Abschnitt „Neue Version veröffentlichen“.
export const CHANGELOG = data as Release[];

const SEEN_KEY = 'changelog-seen';

// Gibt es seit dem letzten Blick in den Changelog eine neue Version?
// Wer die App zum ersten Mal nutzt, bekommt keinen Punkt, sondern startet bei der aktuellen Version.
export function hasUnseenRelease() {
  try {
    const seen = localStorage.getItem(SEEN_KEY);
    if (seen === null) {
      localStorage.setItem(SEEN_KEY, __APP_VERSION__);
      return false;
    }
    return seen !== __APP_VERSION__;
  } catch {
    return false;
  }
}

export function markReleaseSeen() {
  try {
    localStorage.setItem(SEEN_KEY, __APP_VERSION__);
  } catch {
    // Dann bleibt der Punkt eben stehen.
  }
}

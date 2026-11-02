// Macht aus 12.4 Sekunden den Text "0:12".
export function formatSeconds(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

// "2026-11-02T10:15:00Z" wird zu "2.11.2026".
export function formatDate(isoDate: string) {
  return new Date(isoDate).toLocaleDateString('de-DE');
}

// Durchschnitt mit einer Nachkommastelle, etwa "7,5".
export function formatAverage(values: number[]) {
  if (values.length === 0) return '–';
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  return average.toFixed(1).replace('.', ',');
}

// Montag der aktuellen Woche in Berliner Zeit, genau wie week_start in der Datenbank.
export function currentWeekStart() {
  const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Berlin' }).format(new Date());
  const date = new Date(`${today}T00:00:00Z`);
  const daysSinceMonday = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - daysSinceMonday);
  return date.toISOString().slice(0, 10);
}

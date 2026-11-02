## Neue Version veröffentlichen

Die Versionsnummer steht in `package.json`, die Änderungen für Nutzer stehen in `src/changelog.json`. Die App zeigt beides unten im Feed („v0.3.0 · Was ist neu?“).

1. **Code ändern**
2. **Version erhöhen**, vorerst ohne Commit und Tag:
   - `npm version patch --no-git-tag-version` für Fehlerbehebungen und kleine Änderungen (0.3.0 → 0.3.1)
   - `npm version minor --no-git-tag-version` für neue Features (0.3.0 → 0.4.0)
3. **Eintrag ganz oben in `src/changelog.json`** mit derselben Version, einem kurzen Titel und 1–4 Sätzen aus Sicht der Nutzer. `date` ist optional (`"2026-11-02"`).
4. **`npm run build`**: bricht ab, wenn Version und oberster Changelog-Eintrag nicht zusammenpassen.
5. **Committen, taggen, pushen**: ein Commit pro Version, alles zusammen:

```sh
git add -A
git commit -m "v0.3.1: Changelog-Karten aufklappbar"
git tag -a v0.3.1 -m "v0.3.1"
git push --follow-tags
```

Der Tag muss annotiert sein (`-a`), sonst nimmt `git push --follow-tags` ihn nicht mit.

Wer die App öffnet, sieht beim Link „Was ist neu?“ einen roten Punkt, bis die Seite einmal geöffnet wurde. Ältere Einträge sind auf der Seite eingeklappt, nur die beiden neuesten sind offen.

Den Changelog-Text bewusst von Hand schreiben: Commit-Nachrichten sind technisch und nicht für Nutzer gedacht.

---

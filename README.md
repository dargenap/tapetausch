# Tapetausch

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

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.

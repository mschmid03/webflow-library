# Changelog

SemVer bezieht sich auf das Attribut-Schema. Eine Umbenennung oder Bedeutungsänderung eines Attributs ist ein Major
und braucht hier eine Migrationsnotiz.

Überschriften müssen dem Muster `## <version> — <datum>` folgen: `.github/workflows/release.yml` schneidet daraus die Release-Notes.

## 0.4.0 — 2026-08-17

Erste veröffentlichte Fassung. Die Tags `v0.2.0` und `v0.3.0` zeigen auf denselben Codestand und haben kein Release.

- Core: Registry, Bootstrap auf `DOMContentLoaded`, ein zentraler `MutationObserver`, Scope- und Rollen-Auflösung,
  Attribut-Coercion, Idempotenz über `wl-init`, Fehlerkanal über `console.warn` + `wl-error`, Events `wl:<utility>:<aktion>`,
  A11y-Helfer, öffentliche API `window.wl` mit `version`, `init()`, `destroy()`.
- Utility `count`: Optionen `to`, `from`, `duration`, `decimals`, `separator`, `start`.
- Release über `pnpm version`: prüft Changelog, baut das Bundle, taggt und pusht. `.github/workflows/release.yml` verifiziert
  Tag gegen `package.json`, lässt `pnpm check` laufen, prüft `dist/` gegen den Quellstand und legt das Release an.

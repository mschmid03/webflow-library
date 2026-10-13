# Changelog

SemVer bezieht sich auf das Attribut-Schema. Eine Umbenennung oder Bedeutungsänderung eines Attributs ist ein Major
und braucht hier eine Migrationsnotiz.

Überschriften müssen dem Muster `## <version> — <datum>` folgen: `.github/workflows/release.yml` schneidet daraus die Release-Notes.

## 0.6.1 — 2026-10-13

- `count`: Die Animation misst die Zeit jetzt ab dem ersten Frame. Vorher konnte der erste Frame kurz unter den
  Startwert springen. Der Release-Workflow von 0.5.0 und 0.6.0 ist am zugehörigen Test gescheitert, beide Tags haben
  deshalb kein GitHub-Release.

## 0.6.0 — 2026-10-13

- Utility `timespan`: richtet Zeitspannen wie `8:00 – 11:45` untereinander aus, indem alle Startzeiten
  (`wl-timespan="start"`) im Root die Breite der breitesten bekommen (`wl-timespan="root"`). Keine Optionen.

## 0.5.0 — 2026-08-26

- Utility `year`: setzt den Textinhalt eines Elements auf die aktuelle Jahreszahl (`wl-year="root"`).

## 0.4.0 — 2026-08-17

Erste veröffentlichte Fassung. Die Tags `v0.2.0` und `v0.3.0` zeigen auf denselben Codestand und haben kein Release.

- Core: Registry, Bootstrap auf `DOMContentLoaded`, ein zentraler `MutationObserver`, Scope- und Rollen-Auflösung,
  Attribut-Coercion, Idempotenz über `wl-init`, Fehlerkanal über `console.warn` + `wl-error`, Events `wl:<utility>:<aktion>`,
  A11y-Helfer, öffentliche API `window.wl` mit `version`, `init()`, `destroy()`.
- Utility `count`: Optionen `to`, `from`, `duration`, `decimals`, `separator`, `start`.
- Release über `pnpm version`: prüft Changelog, baut das Bundle, taggt und pusht. `.github/workflows/release.yml` verifiziert
  Tag gegen `package.json`, lässt `pnpm check` laufen, prüft `dist/` gegen den Quellstand und legt das Release an.

# Changelog

SemVer bezieht sich auf das Attribut-Schema. Eine Umbenennung oder Bedeutungsänderung eines Attributs ist ein Major
und braucht hier eine Migrationsnotiz.

Überschriften müssen dem Muster `## <version> — <datum>` folgen: `.github/workflows/release.yml` schneidet daraus die Release-Notes.

## 0.1.0 — unveröffentlicht

Erste Fassung.

- Core: Registry, Bootstrap auf `DOMContentLoaded`, ein zentraler `MutationObserver`, Scope- und Rollen-Auflösung,
  Attribut-Coercion, Idempotenz über `wl-init`, Fehlerkanal über `console.warn` + `wl-error`, Events `wl:<utility>:<aktion>`,
  A11y-Helfer, öffentliche API `window.wl` mit `version`, `init()`, `destroy()`.
- Utility `count`: Optionen `to`, `from`, `duration`, `decimals`, `separator`, `start`.

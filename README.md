# webflow-library

Kleine, attributgesteuerte Verhaltens-Utilities für veröffentlichte Webflow-Seiten.
Designer setzen Custom Attributes im Designer, niemand schreibt Projekt-JavaScript.

```html
<!-- Einmal pro Site im Footer Custom Code -->
<script src="https://cdn.jsdelivr.net/gh/mschmid03/webflow-library@1.0.0/dist/wl.min.js"></script>

<!-- Dann am Element, hier: Zahl auf 1200 hochzählen -->
<div wl-count="root" wl-count-to="1200" wl-count-duration="1600">0</div>
```

## Idee in vier Sätzen

Ein Bundle, ein Prefix (`wl-`), zwei Attributformen: `wl-<utility>="<rolle>"` markiert Elemente, `wl-<utility>-<option>="<wert>"` konfiguriert sie am Root-Element.
Mehrere Instanzen pro Seite und CMS-Listen funktionieren ohne IDs, weil Instanzen über den DOM-Scope aufgelöst werden.
Der Core übernimmt Init, Nachladen von DOM, Idempotenz, Fehlermeldungen und A11y-Helfer; Utilities sind dadurch klein und gleichförmig.
Zero Dependencies, keine Webflow-Internals, kein injiziertes CSS.

## Wo was steht

| Datei | Für wen |
|---|---|
| `docs/DESIGNER-GUIDE.md` | Designer: Script einbauen, Attribute setzen, Fehler finden |
| `docs/CONCEPT.md` | Menschen, die wissen wollen warum es so gebaut ist |
| `AGENTS.md` | Coding-Agenten: Einstieg und harte Grenzen |
| `.cursor/rules/wl-attribute-schema.mdc` | verbindliches Attribut-Schema |
| `.cursor/rules/wl-utility-authoring.mdc` | Dateistruktur, Contract, Definition of Done |
| `.cursor/rules/wl-a11y.mdc` | A11y-Mindeststandard |
| `src/utilities/<name>/README.md` | Referenz je Utility (Attribute, Defaults, Events, Fehlercodes) |

## Status

Core und `count` sind gebaut, Bundle liegt bei 3,2 KB min+gzip.
Als nächste Utilities sind gesetzt: `accordion`, `copy` (Copy-to-clipboard), `reveal` (Klasse bei Sichtbarkeit).

| Utility | Zustand | Referenz |
|---|---|---|
| `count` | fertig | `src/utilities/count/README.md` |
| `accordion` | offen | – |
| `copy` | offen | – |
| `reveal` | offen | – |

## Entwicklung

Paketmanager ist **pnpm**. TypeScript, Build mit esbuild zu einer minifizierten IIFE-Datei nach `dist/wl.min.js`, Tests mit Vitest im jsdom.

```bash
pnpm install
pnpm check     # typecheck + test + build
```

`dist/wl.min.js` wird committet, weil jsDelivr direkt aus dem Git-Tag ausliefert.
Zum Prüfen im echten Browser dient `test/manual/index.html` über einen lokalen Webserver; verbindlich ist die Abnahme auf einer veröffentlichten Webflow-Seite.
Versionierung nach SemVer: eine Umbenennung oder Bedeutungsänderung eines Attributs ist ein Major mit Migrationsnotiz in `CHANGELOG.md`.

## Release

Drei Schritte, der Rest läuft automatisch:

```bash
# 1. Changelog-Abschnitt für die neue Version schreiben und committen
git commit -am "Changelog für 0.2.0"

# 2. Version wählen: patch | minor | major
pnpm version minor
```

`pnpm version` führt dabei selbst aus: `pnpm check`, `pnpm build`, `dist/` in den Version-Commit aufnehmen, Tag setzen und Commit plus Tag pushen.
Der Build muss vor dem Tag laufen, weil die Versionsnummer über `__WL_VERSION__` aus der `package.json` ins Bundle eingesetzt wird und `window.wl.version` sonst falsch meldet.

Der Tag-Push löst `.github/workflows/release.yml` aus. Der Workflow prüft, dass Tag und `package.json` übereinstimmen, dass `pnpm check` grün ist und dass `dist/` wirklich aus dem getaggten Quellstand gebaut wurde, und legt dann das GitHub-Release mit dem Changelog-Abschnitt und dem Einbau-Snippet an.

Danach ist die URL sofort nutzbar. Tag-URLs behandelt jsDelivr als unveränderlich, ein Cache-Purge ist nicht nötig:

```html
<script src="https://cdn.jsdelivr.net/gh/mschmid03/webflow-library@0.2.0/dist/wl.min.js"></script>
```

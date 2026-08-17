# webflow-library — Agentenregeln (Einstieg)

Diese Library liefert kleine, attributgesteuerte Verhaltens-Utilities für **veröffentlichte Webflow-Seiten**.
Designer setzen 1–3 Custom Attributes im Designer. Niemand schreibt Projekt-JavaScript.

Das Attribut-Schema ist der öffentliche Vertrag. Es zu brechen ist ein Breaking Change.

## Nicht verhandelbar

1. Prefix ist `wl-`, ohne `data-`. Verboten: `data-wl-…`, `fs-…`, camelCase-Attribute, generische Namen wie `data-util-…`.
2. Es gibt genau zwei Attributformen (siehe Grammatik). Eine dritte Form wird nicht erfunden.
3. Utilities parsen keine Attribute, suchen kein DOM, warten auf kein Ready-Event, registrieren keinen `MutationObserver`. Das macht ausschließlich der Core.
4. Zero Dependencies. Nur Browser-APIs. Kein GSAP, kein Lodash, kein Polyfill.
5. Keine Webflow-Internals: kein `Webflow.push`, kein `ix2`-Zugriff, kein Zugriff auf Webflow-eigene Klassen wie `w-dyn-item` zur Steuerung.
6. A11y-Mindeststandard gilt ab der ersten Utility, nicht später.
7. Paketmanager ist **pnpm**. Kein `npm install`, kein `yarn`.
8. Kein Utility-Code ohne README, Test und Registrierung in `src/index.ts`.

## Grammatik (vollständig, es gibt keine weitere Form)

| Form | Bedeutung | Beispiel |
|---|---|---|
| `wl-<utility>="<rolle>"` | markiert ein Element als Teil der Utility | `wl-accordion="trigger"` |
| `wl-<utility>-<option>="<wert>"` | konfiguriert die Utility, **nur am Root** | `wl-count-duration="1600"` |

- `<utility>` ist **genau ein Token** ohne Bindestrich: `count`, `copy`, `accordion`, `reveal`.
- Jede Utility hat die Rolle `root`. Der Root ist gleichzeitig der Scope-Container der Instanz.
- Optionen werden ausschließlich am Root gelesen. Kein Sub-Element trägt Optionen.
- Reserviert für den Core, von Utilities nie gesetzt oder gelesen: `wl-init`, `wl-error`.
- Reservierte Optionsnamen: `id`, `for` (Instanz-Escape-Hatch).

```html
<!-- ✅ RICHTIG -->
<div wl-count="root" wl-count-to="1200" wl-count-duration="1600">0</div>

<!-- ❌ FALSCH -->
<div wlCountUp="true" data-wl-count-to="1200" wl-count-up-to="1200" fs-count-to="1200">0</div>
```

## Befehle

```bash
pnpm install
pnpm typecheck   # tsc --noEmit
pnpm test        # vitest run (jsdom)
pnpm build       # esbuild -> dist/wl.min.js
pnpm check       # alle drei, muss vor jedem Commit grün sein
```

## Release

1. Abschnitt in `CHANGELOG.md` schreiben. Überschrift zwingend `## <version> — <YYYY-MM-DD>` mit der Version, die als nächstes entsteht.
2. Diesen Stand committen. `pnpm version` verlangt ein sauberes Arbeitsverzeichnis.
3. `pnpm version patch|minor|major`. Das prüft den Changelog, baut, nimmt `dist/` in den Version-Commit, taggt und pusht.
4. Stufe nicht raten: Attribut umbenannt oder Bedeutung geändert heißt Major mit Migrationsnotiz. Neue Utility oder neue Option heißt Minor. Reiner Bugfix heißt Patch.

Bricht `pnpm version` wegen des Changelogs ab, ist noch kein Tag entstanden. Dann `git checkout package.json`, Abschnitt ergänzen, erneut starten.
Ohne Quelländerung wird nicht releast: ein Tag, dessen Commit nur `package.json` und `dist/` anfasst, ist ein Fehler.

Nie `dist/wl.min.js` per Hand editieren. Der Release-Workflow baut neu und bricht bei Abweichung ab.

## Einbindung in Kundenprojekten

Genau ein Script im Site-wide Footer Custom Code, Version gepinnt, nie `@latest`:

```html
<script src="https://cdn.jsdelivr.net/gh/mschmid03/webflow-library@1.0.0/dist/wl.min.js"></script>
```

## Vor jeder Änderung lesen

- `.cursor/rules/wl-attribute-schema.mdc` — Attributnamen, Werte, Instanzen, Fehlerkanal
- `.cursor/rules/wl-utility-authoring.mdc` — Dateistruktur, Utility-Contract, Definition of Done
- `.cursor/rules/wl-a11y.mdc` — A11y-Pflichtprüfliste
- `docs/CONCEPT.md` — warum es so ist (Begründungen, Abgrenzung, Abweichungen von Finsweet)
- `docs/DESIGNER-GUIDE.md` — wie Designer die Utilities anwenden

## Wenn eine Anforderung nicht ins Schema passt

Nicht das Schema beugen. Prüfe zuerst mit dem Utility-Test in `.cursor/rules/wl-utility-authoring.mdc`,
ob es überhaupt eine Utility ist. Fällt sie durch, ist die Antwort: gehört nicht in diese Library.

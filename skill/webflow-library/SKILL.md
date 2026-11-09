---
name: webflow-library
description: "Wissen über Marius' eigene webflow-library (mschmid03/webflow-library): Script wl.min.js, Custom Attributes mit Prefix wl- für veröffentlichte Webflow-Seiten. Utilities: count (Zählt den Textinhalt eines Elements von einem Startwert auf einen Zielwert hoch); timespan (Richtet Zeitspannen wie `8:00 – 11:45` untereinander aus); year (Setzt den Textinhalt eines Elements auf die aktuelle Jahreszahl). Nutze diesen Skill immer, wenn in einem Webflow-Projekt wl-Attribute gesetzt, geprüft oder debuggt werden, das wl.min.js-Script eingebunden oder auf eine neue Version gehoben wird, Attribute wie wl-error oder wl-init auftauchen, oder wenn jemand ein solches Verhalten ohne eigenes JavaScript umsetzen will oder fragt, ob die Library etwas kann, auch wenn sie nicht beim Namen genannt wird."
---

# webflow-library (`wl-`-Attribute)

<!-- Generiert von scripts/skill.mjs aus skill-src/SKILL.template.md und src/utilities/*/README.md. Nicht hier editieren. -->

Eigene Library von Marius (Repo `mschmid03/webflow-library`, aktueller Stand **0.6.1**).
Sie liefert kleine Verhaltens-Utilities für **veröffentlichte** Webflow-Seiten. Designer setzen Custom Attributes
im Designer, niemand schreibt Projekt-JavaScript. Das Attribut-Schema ist der öffentliche Vertrag.

## Einbindung

Genau ein Script pro Site, in **Site settings → Custom code → Footer code**, Version gepinnt:

```html
<script src="https://cdn.jsdelivr.net/gh/mschmid03/webflow-library@0.6.1/dist/wl.min.js"></script>
```

- Nie `@latest`, nie ohne Version. Sonst ändert sich ein fertiges Projekt ohne Zutun.
- Vor dem Einfügen prüfen, ob das Script schon im Footer steht. Doppelt eingebunden warnt der Core in der Konsole.
- Steht dort eine ältere Version, nur bewusst anheben: Ein Sprung über eine Major-Version (z. B. 1.x → 2.x) kann
  Attribute umbenennen. Die Migrationsnotizen stehen im `CHANGELOG.md` des Repos.
- Neue Utilities brauchen mindestens die Version, in der sie erschienen sind (Spalte „seit" unten).

## Grammatik (vollständig, es gibt keine dritte Form)

| Form | Bedeutung | Beispiel |
|---|---|---|
| `wl-<utility>="<rolle>"` | markiert ein Element als Teil der Utility | `wl-count="root"` |
| `wl-<utility>-<option>="<wert>"` | konfiguriert die Utility, **nur am Root** | `wl-count-to="1200"` |

- Prefix ist `wl-`, ohne `data-`. Kein camelCase, kein `fs-`.
- Jede Utility hat die Rolle `root`. Der Root ist der Scope: Sub-Elemente gehören zum nächsten Vorfahren mit `wl-<utility>="root"`.
- Mehrere Instanzen pro Seite brauchen **keine** Nummern oder IDs. Vier Roots sind vier Instanzen.
- In CMS-Listen kommen die Attribute ins Collection Item (bzw. an den Wrapper, wenn die Utility die ganze Liste umfasst, siehe Referenz).
- Werte: Ja/Nein immer als `true`/`false` ausschreiben, Zahlen ohne Einheit (`1600`, nicht `1600ms`), Dezimalpunkt (`1.5`).
- Klassennamen in Optionen so schreiben, wie die Klasse in Webflow heißt (`is-visible`).
- `wl-init` und `wl-error` setzt nur der Core. Nie selbst im Designer setzen.
- Reservierte Optionen `wl-<utility>-id` / `wl-<utility>-for` verbinden Teile, die außerhalb des Roots liegen. Nur benutzen, wenn die Utility-Referenz das vorsieht.

**Nur Attribute verwenden, die in der Referenz der Utility stehen.** Keine Optionen oder Rollen erfinden. Unbekannte
Attribute führen zu `wl-error="<utility>:unknown-option"` bzw. `unknown-role`.

## Verfügbare Utilities

| Utility | seit | Zweck | Referenz |
|---|---|---|---|
| `count` | 0.4.0 | Zählt den Textinhalt eines Elements von einem Startwert auf einen Zielwert hoch | [references/count.md](references/count.md) |
| `timespan` | 0.6.0 | Richtet Zeitspannen wie `8:00 – 11:45` untereinander aus | [references/timespan.md](references/timespan.md) |
| `year` | 0.5.0 | Setzt den Textinhalt eines Elements auf die aktuelle Jahreszahl | [references/year.md](references/year.md) |

### `count`

Zählt den Textinhalt eines Elements von einem Startwert auf einen Zielwert hoch.

```html
<div wl-count="root" wl-count-to="1200" wl-count-duration="1600" wl-count-separator=".">1.200</div>
```

### `timespan`

Richtet Zeitspannen wie `8:00 – 11:45` untereinander aus: Alle Startzeiten bekommen die Breite der breitesten, dadurch stehen Bindestrich und Endzeit in jeder Zeile auf derselben Höhe.

```html
<div wl-timespan="root">
  <p><span wl-timespan="start">8:00</span> – 11:45</p>
  <p><span wl-timespan="start">15:00</span> – 17:00</p>
  <p><span wl-timespan="start">10:00</span> – 11:45</p>
</div>
```

### `year`

Setzt den Textinhalt eines Elements auf die aktuelle Jahreszahl — z. B. für Copyright-Zeilen im Footer.

```html
<p>© <span wl-year="root">2025</span> Studio Name</p>
```

Vor dem Setzen von Attributen die Referenz der Utility lesen: Rollen, Pflichtoptionen, Defaults, Grenzen.

## Anwenden im Webflow Designer

1. Element auswählen → **Settings**-Panel (Zahnrad) → **Custom attributes** → **+** → Name und Wert eintragen.
   Mit dem Webflow-MCP-Connector geht das auch per Tool, sofern er Custom Attributes am Element setzen kann.
2. Script im Footer prüfen bzw. einfügen (siehe oben).
3. Custom Code läuft **nicht** im Designer-Canvas und nicht in der Vorschau. Zum Testen veröffentlichen (Staging auf `…webflow.io` reicht).

## Fehlersuche auf der veröffentlichten Seite

Element im Browser untersuchen:

| Befund | Bedeutung |
|---|---|
| `wl-init="<utility>"` am Root | Instanz läuft |
| `wl-error="<utility>:<code>"` | Konfigurationsfehler, dazu `console.warn` mit `[wl:<utility>]` |
| weder noch | Element nicht erkannt: Tippfehler im Attributnamen, Script fehlt oder Seite nicht neu veröffentlicht |

Core-Codes, die jede Utility haben kann:

| Code | Ursache |
|---|---|
| `missing-<option>` | Pflichtoption fehlt am Root, Instanz startet nicht |
| `invalid-<option>` | Wert hat den falschen Typ; bei Pflichtoption startet die Instanz nicht, sonst greift der Default |
| `missing-<rolle>` / `duplicate-<rolle>` | Pflicht-Element fehlt bzw. Einzelrolle doppelt im Root |
| `unknown-role` / `unknown-option` | Rolle oder Option gibt es bei dieser Utility nicht |
| `option-on-part` | Option steht an einem Sub-Element statt am Root |
| `init-failed` | Laufzeitfehler in der Utility, Konsole ansehen |

Utility-eigene Codes stehen in der jeweiligen Referenz. `window.wl.version` in der Konsole zeigt die geladene Version.

## JavaScript-API (nur für Entwickler, nie Pflicht)

- `window.wl.version`, `window.wl.init(target?)`, `window.wl.destroy(target?)`. `init` ist nur nötig, wenn DOM an
  einem Weg vorbei entsteht, den der eingebaute `MutationObserver` nicht sieht. Normales CMS-Nachladen erkennt der Core selbst.
- Events heißen `wl:<utility>:<aktion>`, werden am Root dispatcht, bubbeln, `detail` enthält mindestens `{ root }`.

## Wenn die Library etwas nicht kann

Kein Verhalten mit erfundenen `wl-`-Attributen versprechen. Sagen, dass es (noch) keine Utility dafür gibt, und abwägen:

- **Neue Utility in der Library**, wenn alle sechs Punkte zutreffen: rein über Attribute steuerbar ohne JS-Aufruf;
  kennt keine Projekt-Domäne (keine fixen Klassen, Texte, IDs); höchstens 6 Optionen; nur Browser-APIs; ändert Markup
  nicht strukturell; sinnvoll auf mindestens drei Projekten.
- **Sonst** gehört es nicht in die Library: Webflow-Interactions, natives Webflow-Feature oder projektspezifischer Code.
  Explizit keine Utilities: Third-Party-Wrapper (Cookie-Banner, Analytics, Chat), Formular-/API-Integrationen, Slider
  und Layout-Engines, CMS-Filter/Sort/Load-More, Webflow-Bug-Workarounds, alles mit eigenem CSS.

## Arbeiten an der Library selbst

Im Repo gelten `AGENTS.md` und `.cursor/rules/*.mdc` (Schema, Utility-Contract, A11y-Pflicht). Paketmanager ist pnpm,
`pnpm check` muss vor jedem Commit grün sein. Dieser Skill wird aus dem Repo generiert: Nach Änderungen an Utilities,
READMEs oder `skill-src/SKILL.template.md` läuft `pnpm skill`, und das Ergebnis wird mit committet.

# Konzept: webflow-library

Menschliche Fassung der Entscheidungen. Die verbindlichen Regeln für Agenten stehen in `AGENTS.md` und `.cursor/rules/`.
Dieses Dokument erklärt, **warum** es so ist — bei Konflikt gewinnen die Regeln.

## Zielnutzer

**Designer (primär).** Setzt im Webflow Designer 1–3 Custom Attributes an einem Element und bekommt Verhalten. Kein JS, kein Init-Aufruf, kein Wissen über Ladereihenfolge. Das Attribut-Schema ist der verbindliche Vertrag der Library.

**Entwickler (sekundär).** Nutzt `window.wl` für Re-Init und Cleanup und hört auf CustomEvents, wenn ein Projekt etwas Eigenes anhängen muss. Diese API darf nie nötig sein, damit eine Utility funktioniert.

**Coding-Agent (Werkzeug).** Leitet aus dem Schema Attributnamen, Dateipfade und Fehlercodes ab, ohne zu fragen.

## Architektur

Ein TypeScript-Paket, gebaut mit pnpm zu **einer** minifizierten IIFE-Datei ohne Dependencies. Zwei Schichten:

**Core** (einmal geschrieben, selten geändert): Registry aller Utilities, Bootstrap, ein einziger `MutationObserver` auf `document.body`, Attribut-Parser mit Typ-Coercion, Scope- und Instanz-Auflösung, Idempotenz-Marker, Fehlerkanal, Event-Dispatch, A11y-Helfer (`ensureFocusable`, `ensureId`, `prefersReducedMotion`, sr-only Live-Region).

**Utilities** (viele, klein, gleichförmig): deklarieren Name, Rollen, Options-Schema und eine `init`-Funktion, die eine fertig aufgelöste Instanz bekommt. Sie suchen kein DOM, parsen keine Attribute, warten auf kein Ready-Event, registrieren keinen Observer.

Der Effekt ist beabsichtigt: eine neue Utility ist strukturell nicht in der Lage, das Schema zu verletzen, weil alles Schema-Relevante im Core passiert.

```
src/core/          Registry, Bootstrap, Observer, Parser, Fehler, Events, A11y
src/utilities/<name>/  index.ts + README.md + <name>.test.ts
src/index.ts       registriert alle Utilities
dist/wl.min.js     Auslieferung
```

## Attribut-Schema

Es gibt genau zwei Formen: `wl-<utility>="<rolle>"` markiert Elemente, `wl-<utility>-<option>="<wert>"` konfiguriert die Instanz am Root.

Der Utility-Name ist genau ein Token ohne Bindestrich. Das ist keine Kosmetik: dadurch ist das erste Segment nach `wl-` immer der Utility-Name und der Rest immer der Optionsname, und der Parser braucht kein Raten und keine Registry-Abfrage. Deshalb heißt die In-View-Utility `reveal` und nicht `in-view`.

Rollen leben im Attributwert, Optionen ausschließlich am Root. Damit liest ein Designer jede Konfiguration an genau einer Stelle. Braucht eine Option einen Elementbezug, referenziert sie per 1-basiertem Index statt per Selektor, weil Selektoren im Designer nicht wartbar sind.

Defaults haben genau zwei Quellen: Attribut am Root oder Code-Default. Keine Vererbung von Parents, keine globale Konfiguration am Script-Tag. Jede zusätzliche Ebene wäre eine Fehlerquelle, die ein Designer nicht debuggen kann.

Instanzen werden implizit über den DOM-Scope aufgelöst: ein Sub-Element gehört zum nächsten Vorfahren mit `wl-<utility>="root"`. Mehrere Instanzen pro Seite und CMS-Listen funktionieren dadurch ohne Zutun. Nur wenn ein Teil außerhalb des Roots liegt, greifen `wl-<utility>-id` und `wl-<utility>-for`.

Reserviert für den Core: `wl-init` (Idempotenz) und `wl-error` (sichtbarer Fehler im Inspector).

## Init- und Runtime-Modell

Der Core startet bei `DOMContentLoaded` oder sofort, falls das Dokument schon geparst ist, und scannt einmal das Dokument. Danach beobachtet **ein** `MutationObserver` `document.body` und verarbeitet Änderungen gebündelt im nächsten Animation Frame: neue Teilbäume werden gescannt, entfernte Roots bekommen ihr Cleanup. Damit sind CMS-Nachladen, Pagination, Filter-Ergebnisse und Tab-Inhalte abgedeckt, ohne dass eine Utility davon weiß.

Init ist idempotent: der Core prüft `wl-init`, ein zweiter Init für dieselbe Utility am selben Element ist ein No-op.

Webflow-Internals werden nicht angefasst — kein `Webflow.push`, kein `ix2`. Kommunikation nach außen läuft über Klassen, Attribute und Events `wl:<utility>:<aktion>`. Öffentliche API: `wl.version`, `wl.init(target?)`, `wl.destroy(target?)`.

Fehlerverhalten in zwei Stufen: „nichts zu tun" ist still, „falsch konfiguriert" ergibt `console.warn` plus `wl-error` am Element, und die Instanz initialisiert nicht. Der Grund für das Attribut: ein Designer sieht den Fehler im Inspector, ohne die Konsole zu öffnen.

A11y ist Pflicht ab Utility 1: Tastaturbedienbarkeit, `aria-expanded`/`aria-controls`, sr-only Live-Region für Statusmeldungen, sofortiger Endzustand bei `prefers-reduced-motion`. Details in `.cursor/rules/wl-a11y.mdc`.

## Einbindung in Webflow

Ein Script pro Site, versioniert, im Site-wide Footer Custom Code:

```html
<script src="https://cdn.jsdelivr.net/gh/mschmid03/webflow-library@1.0.0/dist/wl.min.js"></script>
```

Version wird gepinnt, nie `@latest`. SemVer gilt für das Attribut-Schema: eine Umbenennung oder Bedeutungsänderung eines Attributs ist ein Major mit Migrationsnotiz. Alle Utilities liegen in diesem einen Bundle und aktivieren sich nur, wenn ihr Attribut im DOM vorkommt.

## Abgrenzung

Eine Utility ist eine Utility, wenn **alle** Punkte zutreffen: allein über Attribute steuerbar; kennt keine Projekt-Domäne; maximal 6 Optionen; nur Browser-APIs; ändert bestehendes Markup nicht strukturell, sondern ergänzt höchstens eigene A11y-Hilfselemente; setzt kein Stylesheet, nur Klassen, Attribute, Text und unvermeidbare dokumentierte Inline-Styles; und ist auf mindestens drei unterschiedlichen Projekten sinnvoll.

Ausdrücklich **keine** Utility: Third-Party-Wrapper (Cookie-Banner, Analytics, Chat), Formular- und API-Integrationen, eigene Rendering-Engines wie Slider oder Layout-Systeme, CMS-Schwergewichte wie Filter/Sort/Load-More, Workarounds für Webflow-Bugs, alles was Design-Tokens oder CSS mitbringt, projektspezifische Geschäftslogik.

## Beispiele im finalen Schema

**Count-up.** Rollen: `root`. Optionen: `to` (Pflicht), `from` (0), `duration` (1200), `decimals` (0), `separator` (keiner), `start` (`visible|load`).

```html
<div wl-count="root" wl-count-to="1200" wl-count-duration="1600" wl-count-separator=".">0</div>
```

Bei reduzierter Bewegung steht sofort `1.200` da. Der Endwert ist echter Textinhalt, kein `aria-live`-Gestottere.
`separator` ist das Tausendertrennzeichen; das Dezimalzeichen wird daraus abgeleitet, damit die Utility bei sechs Optionen bleibt.

**Accordion.** Rollen: `root`, `item`, `trigger`, `content`. Optionen: `single` (true), `initial` (keine), `duration` (250).

```html
<div wl-accordion="root" wl-accordion-single="true" wl-accordion-initial="1">
  <div wl-accordion="item">
    <div wl-accordion="trigger">Frage</div>
    <div wl-accordion="content">Antwort</div>
  </div>
</div>
```

In einer CMS-Liste wird der Item-Wrapper zum Root: beliebig viele Instanzen, keine IDs, keine `-2`-Suffixe.

**Copy-to-clipboard.** Rollen: `root`, optional `source`. Optionen: `value`, `feedback`, `feedback-duration`, `label`.

```html
<a wl-copy="root" wl-copy-value="hallo@studio.de" wl-copy-feedback="is-copied">E-Mail kopieren</a>
```

Fehlen `value` und `source`, gibt es `wl-error="copy:no-source"` plus Warnung.

Die vierte Erst-Utility ist **reveal**: `wl-reveal="root"`, `wl-reveal-class`, `wl-reveal-threshold`, `wl-reveal-once`.

## Bewusste Abweichungen von Finsweet

Finsweet kodiert Rolle und Instanz in einem Attributwert (`…-element="list-2"`). Wir trennen strikt: Rolle ist der Wert, Instanz ist der DOM-Scope. Das entfernt die fehleranfälligste Stelle ihres Modells.

Finsweet verteilt Optionen über Root und Sub-Elemente. Bei uns liegen Optionen ausnahmslos am Root, damit eine Konfiguration an einer Stelle lesbar ist.

Finsweet trägt Solution-Namen und Generationen in Attributnamen (`fs-cmsfilter-…` → `fs-list-…`) und liefert ein Script pro Solution. Wir haben ein Bundle, eine versionierte URL und einen Utility-Namen aus einem Token.

Finsweet failt in vielen Fällen still. Wir machen Konfigurationsfehler über `wl-error` im Inspector sichtbar.

Beim Scope gehen wir ihrem Kern bewusst aus dem Weg: keine CMS-Filter-, Sort- oder Load-Engines.

Übernommen wird genau eine Sache, mit offenem Trade-off: das Prefix ohne `data-` ist streng genommen kein valides HTML, gewinnt aber im Designer an Kürze und ist im Webflow-Ökosystem etabliert. Browser ignorieren unbekannte Attribute, deshalb ist der praktische Preis null.

## Offene Punkte für später

- Globale Optionen am Script-Tag (z. B. `locale` für Zahlenformate) nur als eine dokumentierte Ausnahme, falls mehrere Utilities dasselbe Formatproblem haben.
- npm-Publishing zusätzlich zur CDN-URL, sobald ein Projekt bundlen statt einbinden will.
- Webflow Code Components als zweite, klar abgegrenzte Säule: Attribute-Scripts für Verhalten auf bestehendem Markup, Code Components für neue UI-Bausteine.

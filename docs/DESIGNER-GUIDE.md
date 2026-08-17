# Designer-Guide

Für alle, die im Webflow Designer arbeiten. Du brauchst kein JavaScript, nur Custom Attributes.

## 1. Script einmal pro Projekt einbauen

Webflow → **Site settings → Custom code → Footer code**, dort einfügen und die Site veröffentlichen:

```html
<script src="https://cdn.jsdelivr.net/gh/mschmid03/webflow-library@1.0.0/dist/wl.min.js"></script>
```

Die Versionsnummer bleibt stehen. Nicht auf `@latest` ändern — sonst verändert sich ein fertiges Projekt ohne dein Zutun.

## 2. Attribute an einem Element setzen

Element auswählen → rechts im **Settings**-Panel (Zahnrad) → **Custom attributes** → **+** → Name und Wert eintragen.

Es gibt nur zwei Arten von Attributen:

| Art | Aussehen | Wofür |
|---|---|---|
| Rolle | `wl-count` = `root` | sagt: dieses Element gehört zur Utility, und zwar in dieser Rolle |
| Option | `wl-count-to` = `1200` | stellt etwas ein — **immer am `root`-Element** |

Merksatz: `wl-` + Name der Utility + optional `-` + Name der Einstellung.

## 3. Beispiel: Zahl hochzählen

An einem Text-Element:

| Name | Wert |
|---|---|
| `wl-count` | `root` |
| `wl-count-to` | `1200` |
| `wl-count-duration` | `1600` |

Der Text im Element kann `0` sein — die Utility überschreibt ihn beim Hochzählen.

## 4. Regeln, die dir Ärger ersparen

- **Optionen gehören ans `root`-Element.** Ein `wl-…-duration` an einem Trigger oder Content wird ignoriert.
- **Ja/Nein-Werte immer ausschreiben:** `true` oder `false`. Ein leeres Feld ist kein „ja".
- **Zahlen ohne Einheit:** `1600`, nicht `1600ms`. Kommazahlen mit Punkt: `1.5`.
- **Mehrere Instanzen brauchen keine Nummern.** Jede Utility gehört zu ihrem eigenen `root`. Vier Accordions auf einer Seite? Vier `root`-Elemente, fertig. Kein `root-2`.
- **In CMS-Listen** setzt du die Attribute im Collection Item, nicht an der Liste. Der Wrapper im Item ist dann der `root`.
- **Klassennamen** in Optionen wie `wl-reveal-class` schreibst du genau so, wie die Klasse in Webflow heißt — bei „Is Visible" also `is-visible`.

## 5. Testen

Custom Code läuft **nicht** im Designer-Canvas und nicht in der Designer-Vorschau. Zum Testen die Site veröffentlichen (Staging auf `…webflow.io` genügt) und dort prüfen.

## 6. Wenn etwas nicht funktioniert

Auf der veröffentlichten Seite Rechtsklick → **Untersuchen** und das Element ansehen:

- Steht dort ein Attribut **`wl-error`**, ist etwas falsch konfiguriert. Der Wert sagt was: `wl-error="count:missing-to"` heißt, die Pflicht-Option `wl-count-to` fehlt am `root`.
- Steht dort ein Attribut **`wl-init`** mit dem Namen der Utility, hat sie korrekt gestartet.
- Steht keines von beiden da, wurde das Element nicht erkannt: meist ein Tippfehler im Attributnamen oder das Script fehlt im Footer.

Die genauen Attribute, Pflichtfelder und Standardwerte jeder Utility stehen in ihrer README unter `src/utilities/<name>/README.md`.

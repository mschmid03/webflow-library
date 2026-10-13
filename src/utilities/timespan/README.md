# timespan

Richtet Zeitspannen wie `8:00 – 11:45` untereinander aus: Alle Startzeiten bekommen die Breite der breitesten,
dadurch stehen Bindestrich und Endzeit in jeder Zeile auf derselben Höhe.

## Rollen

| Attribut | Pflicht | Wo |
|---|---|---|
| `wl-timespan="root"` | ja | am Container, der alle auszurichtenden Zeilen enthält (z. B. die Öffnungszeiten-Liste) |
| `wl-timespan="start"` | ja, mindestens eins | am Element um die **Startzeit** jeder Zeile, z. B. ein Span um `8:00` |

Bindestrich und Endzeit stehen direkt hinter dem `start`-Element, als Text oder in eigenen Elementen.

## Optionen

Keine. Es reichen `wl-timespan="root"` und `wl-timespan="start"`.

## Beispiel

```html
<div wl-timespan="root">
  <p><span wl-timespan="start">8:00</span> – 11:45</p>
  <p><span wl-timespan="start">15:00</span> – 17:00</p>
  <p><span wl-timespan="start">10:00</span> – 11:45</p>
</div>
```

In einer CMS-Liste kommt `root` an die Collection List (oder einen Wrapper darum), `start` an das Textfeld mit der Startzeit
in jedem Item. Startzeit und Endzeit müssen dafür **zwei getrennte Felder** sein. Steht die ganze Spanne in einem Feld,
lässt sich die Startzeit nicht markieren.

## Events

Keine.

## Fehlercodes

| `wl-error` | Bedeutung |
|---|---|
| `timespan:missing-start` | im Root liegt kein Element mit `wl-timespan="start"`. Die Instanz wird übersprungen |
| `timespan:unknown-option` | ein `wl-timespan-…`-Attribut ist keine Option dieser Utility |

## Grenzen

- Setzt Inline-Styles an jedem `start`-Element: `min-width` und, falls es ein Inline-Element ist, `display: inline-block`.
  Beim Abräumen werden die vorherigen Werte wiederhergestellt.
- Die Startzeiten werden linksbündig ausgerichtet. Soll die Startzeit rechtsbündig stehen, im Designer `text-align: right` am `start` setzen.
- Gemessen wird beim Initialisieren, nach dem Laden der Webfonts und bei jeder Größenänderung des Roots (Breakpoints,
  Einblenden aus `display: none`). Ohne `ResizeObserver` (sehr alte Browser) bleibt es beim ersten Messwert.
- Bricht eine Zeile um, weil der Platz nicht reicht, richtet die Utility die umgebrochene Zeile nicht aus.

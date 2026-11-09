# count

Zählt den Textinhalt eines Elements von einem Startwert auf einen Zielwert hoch.

## Rollen

| Attribut | Pflicht | Wo |
|---|---|---|
| `wl-count="root"` | ja | am Text-Element, das die Zahl anzeigt |

Die Utility hat keine Sub-Elemente. Der Textinhalt des Roots wird überschrieben — im Root darf nur die Zahl stehen.
Schreib den **Zielwert** als Text in den Root, nicht `0`: Diesen Wert lesen Suchmaschinen, Screenreader und Linkvorschauen.
Zeichen wie `+`, `%` oder `€` gehören in ein Nachbar-Element, nicht in den Root.

## Optionen

Alle Optionen stehen am Root.

| Attribut | Typ | Pflicht | Default | Beispiel |
|---|---|---|---|---|
| `wl-count-to` | Zahl | **ja** | – | `1200` |
| `wl-count-from` | Zahl | nein | `0` | `100` |
| `wl-count-duration` | ganze ms | nein | `1200` | `1600` |
| `wl-count-decimals` | Zahl | nein | `0` | `1` |
| `wl-count-separator` | Text | nein | keiner | `.` |
| `wl-count-start` | `visible` \| `load` | nein | `visible` | `load` |

`wl-count-separator` ist das Tausendertrennzeichen. Das Dezimalzeichen wird daraus abgeleitet: bei `,` wird `.` verwendet, sonst `,`.
Mit `wl-count-start="visible"` bleibt der Text aus dem HTML stehen, bis das Element sich dem Viewport auf eine halbe
Viewporthöhe nähert. Erst dann wird der Startwert gesetzt. Die Animation startet, sobald 25 % des Elements im Viewport sind,
und genau einmal. Mit `wl-count-start="load"` steht der Startwert sofort da.

## Beispiel

```html
<div wl-count="root" wl-count-to="1200" wl-count-duration="1600" wl-count-separator=".">1.200</div>
```

Ergebnis: bis kurz vor dem Sichtbarwerden steht `1.200` im DOM, dann läuft die Zahl von `0` auf `1.200`.

## Events

| Event | Wann | `detail` |
|---|---|---|
| `wl:count:start` | wenn die Animation beginnt | `{ root, value }` mit dem Startwert |
| `wl:count:complete` | wenn der Zielwert steht | `{ root, value }` mit dem Zielwert |

Bei reduzierter Bewegung entfällt `wl:count:start`, weil nicht animiert wird.

## Fehlercodes

| `wl-error` | Bedeutung |
|---|---|
| `count:missing-to` | `wl-count-to` fehlt am Root, die Instanz startet nicht |
| `count:invalid-to` | `wl-count-to` ist keine Zahl, die Instanz startet nicht |
| `count:invalid-<option>` | eine optionale Option ist ungültig, der Standardwert greift |
| `count:unknown-option` | ein `wl-count-…`-Attribut ist keine Option dieser Utility |

## Grenzen

- Bei `prefers-reduced-motion: reduce` steht der Zielwert sofort da, ohne Animation.
- Ohne `IntersectionObserver` im Browser startet die Animation direkt beim Laden.
- Die Sichtbarkeitsschwelle von 25 % und der Vorlauf von einer halben Viewporthöhe sind bewusst nicht konfigurierbar.
- Suchmaschinen, die JavaScript ausführen, rendern oft mit sehr hohem Fenster. Dann startet die Animation auch dort, und
  der festgehaltene Stand kann eine Zwischenzahl sein. Ohne JavaScript steht immer der Text aus dem HTML.

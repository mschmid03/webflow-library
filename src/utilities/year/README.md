# year

Setzt den Textinhalt eines Elements auf die aktuelle Jahreszahl — z. B. für Copyright-Zeilen im Footer.

## Rollen

| Attribut | Pflicht | Wo |
|---|---|---|
| `wl-year="root"` | ja | am Text-Element, das die Jahreszahl anzeigen soll |

Die Utility hat keine Sub-Elemente. Der Textinhalt des Roots wird überschrieben — im Root darf nur die Jahreszahl stehen.
Text wie `©` oder `– Studio` gehört in Nachbar-Elemente, nicht in den Root.

## Optionen

Keine. Es reicht `wl-year="root"`.

## Beispiel

```html
<p>© <span wl-year="root">2025</span> Studio Name</p>
```

Ergebnis: der Platzhalter `2025` wird durch die aktuelle Jahreszahl ersetzt, z. B. `2026`.

## Events

Keine.

## Fehlercodes

| `wl-error` | Bedeutung |
|---|---|
| `year:unknown-option` | ein `wl-year-…`-Attribut ist keine Option dieser Utility |

## Grenzen

- Die Jahreszahl wird beim Initialisieren gesetzt, nicht live um Mitternacht am 1. Januar.
- Die Jahreszahl folgt der lokalen Zeitzone des Browsers (`Date.getFullYear()`).

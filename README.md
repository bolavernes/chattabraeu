# Chattanooga & Wiener Stadtbräu – Website (Prototyp)

Eine Website für beide Lokale am Graben 29a, 1010 Wien: oben das **Chattanooga** (Café & Grill mit Schanigarten), unten das **Wiener Stadtbräu** (Gewölbekeller mit Bierfokus).

**Stand:** Klickbarer Prototyp. Die Illustration und die Raumbilder sind KI-Platzhalter (Higgsfield). Sie werden durch Bolas eigene Zeichnung (Feder + Aquarell, in Ebenen) ersetzt.

## Was drin ist

- **Haus im Schnitt** (Hero): Wenn man über eine Etage fährt oder sie antippt, wird die andere abgedunkelt und die passende Karte darunter hervorgehoben. Ein Schalter wechselt zwischen Tag und Abend. Abends gehen oben die Lampen an, die Keller-Laternen flackern immer. Am Zapfhahn ist ein kleines Easter Egg.
- **Live-Status**: zeigt „Jetzt geöffnet“ oder „Öffnet um …“ nach Wiener Zeit.
- **Räume** als Kartenstapel nach Vorbild Brasserie Zédel. Man kann wischen, Pfeiltasten benutzen oder auf Karten klicken.
- **Oben / Unten**: zwei Sektionen. Die Seite geht über „die Treppe“ von Papier in den dunklen Keller über.
- **Lift-Panel** (EG/UG) springt zwischen den Etagen.
- **Einstieg je Domain**: Unter `stadtbraeu.at` (oder mit `#unten`) öffnet die Seite mit dem Keller vorne.

Es gibt keine Build-Pipeline, kein Tracking und keine Cookies.

## Netlify

Repository verbinden, Build-Befehl leer lassen, Publish-Verzeichnis `.` eintragen. Beide Domains (chattanooga.at, stadtbraeu.at) als Domains derselben Site anlegen.

Solange es ein Prototyp ist, sind die Seiten über `robots.txt`, `X-Robots-Tag` und das Meta-Tag auf `noindex` gesetzt. **Vor dem Livegang alle drei entfernen.**

## Aufbau

| Pfad | Inhalt |
|---|---|
| `index.html` | die ganze Seite |
| `assets/css/site.css` | Farben und Schriften stehen oben in `:root` |
| `assets/js/site.js` | Etagenwahl, Tag/Abend, Kartenstapel, Lift, Öffnungsstatus, Einstieg je Domain |
| `assets/img/` | Platzhalterbilder (WebP) |

## Nächste Schritte

- Illustration in Ebenen liefern (Himmel, Fassade, Schanigarten, Café innen, Erdreich, Keller, Treppe, Lichter). Die Hotspot-Koordinaten in `index.html` (`.glows i`, `.tap`) werden dann angepasst.
- Speisekarten-System vom Adriano übernehmen: `menu.json` pro Etage, Admin mit Etagen-Umschalter, A4-Druck je Marke.
- Echte Inhalte vom Kunden (siehe `Checkliste_vom_Kunden.md` im Projektordner): Bierkarte, Öffnungszeiten Stadtbräu, Events, Impressum.

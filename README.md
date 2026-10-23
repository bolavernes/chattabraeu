# Chattanooga & Wiener Stadtbräu – Website (Prototyp, Richtung B)

Eine Website für beide Lokale am Graben 29a, 1010 Wien: oben das **Chattanooga** (Café & Grill mit Schanigarten), unten das **Wiener Stadtbräu** (Gewölbekeller).

## Aufbau: ein Haus, zwei Lokale

- **Haus** (Startansicht, z. B. auf der Netlify-Adresse): Live-Fassade, Tafel und zwei Türen „Oben: Chattanooga“ und „Unten: Wiener Stadtbräu“.
- **Chattanooga** (`#chattanooga`, Einstieg über chattanooga.at): Das Foto zoomt auf den Eingang. Danach kommen nur Chattanooga-Inhalte: Intro, Speisekarte, Schanigarten, Anfahrt. Das Stadtbräu erscheint nur als eine Zeile auf der Tafel und im Footer.
- **Wiener Stadtbräu** (`#stadtbraeu`, Einstieg über stadtbraeu.at): Das Foto zoomt auf die Stiege. Danach kommen Intro in Rot, Bier & Küche, Termine im Keller und Anfahrt.

Für die Suchmaschinen sollten die beiden Lokale für den Livegang eigene Seiten (`/chattanooga/`, `/stadtbraeu/`) mit eigenem Title werden. Netlify liefert dann je Domain per Rewrite die richtige Seite aus. Für den Prototyp reicht eine Seite mit Ansichten.

## Die Idee

Der Hero ist ein Foto der Fassade, das zeigt, wie es **gerade jetzt** am Graben ist:

- **Tageszeit nach Sonnenstand:** Tag, Dämmerung (±40 Minuten um Sonnenauf- und -untergang) oder Nacht. Die Sonnenzeiten werden lokal berechnet, dafür braucht es keine API.
- **Wetter live** von Open-Meteo (kostenlos, ohne Schlüssel). Bei Regen und Schnee fällt Regen bzw. Schnee über das Foto, bei Nebel liegt ein Schleier darüber. Auf dem Foto sind Hotspots für Chattanooga, die Stiege zum Stadtbräu und den Schanigarten.
- **Schwarze Tafel darunter** mit dem Live-Stand, z. B. „Freitag, 11:34 am Graben. 11 Grad, bedeckt.“, und dem Status von Chattanooga, Schanigarten und Stadtbräu (offen, schließt bald, öffnet um …). Der Schanigarten ist bei Regen oder Schnee automatisch zu und im Winter auf „Winterpause“.

Danach kommen „Das Haus“ (links Chattanooga auf Weiß, rechts Stadtbräu auf Rot mit den Banner-Streifen), die Speisekarte mit Tabs pro Lokal und die Anfahrt mit Live-Öffnungszeiten.

Der **Vorschau-Regler** (gelbe Leiste oben, nur im Prototyp) simuliert Uhrzeit, Wetter, Schanigarten-Saison und Domain.

## Stand der Inhalte

- **Fassadenfotos:** KI-Platzhalter (Higgsfield). Sie werden ersetzt durch drei echte Fotos vom selben Standpunkt (Tag, Dämmerung, Nacht), am besten von Timos Team mit Stativ.
- **Logos:** aus den alten Websites nachgezeichnet (`assets/img` / SVG-Sprite in `index.html`). Für den Livegang braucht es die Original-Vektoren.
- **Innenräume und Essen:** Fotos der alten Websites.
- **Stadtbräu:** Karte von 2018, Termine laut Falter, Öffnungszeiten noch unbestätigt.

## Einstellungen

Öffnungszeiten und Schanigarten-Regeln stehen oben in `assets/js/site.js` (`CONFIG`). Später kommen sie aus dem Editor.

## Netlify

Repository verbinden, Build-Befehl leer lassen, Publish-Verzeichnis `.` eintragen, beide Domains auf dieselbe Site legen. Die Seite ist noch auf `noindex` gestellt (`robots.txt`, `X-Robots-Tag`, Meta-Tag). **Vor dem Livegang alle drei entfernen.**

## Nächste Schritte

- Speisekarten-System vom Adriano übernehmen: `menu.json` pro Lokal, Admin mit Lokal-Umschalter, A4-Druck je Marke. Öffnungszeiten und Schanigarten-Saison kommen in denselben Editor.
- Echte Fotos und Inhalte vom Kunden (siehe `Checkliste_vom_Kunden.md` im Projektordner).

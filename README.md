# Laufspur

GPX rein, Poster raus. Laufspur macht aus einer GPX-Datei (Garmin, Apple Health, Strava-Export …) ein druckfertiges Laufposter.
Alles läuft im Browser; die GPX-Datei wird nirgends hochgeladen.

**Starten:** `index.html` im Browser öffnen oder über GitHub Pages aufrufen.

## Funktionen

- **8 Vorlagen:** Tartan, Glut, Startnummer, Zielsprint, Stoppuhr, Riso, Medaille, Wellen
- **Kennzahlen nach Wahl:** Distanz, Zeit, Pace, Höhenmeter, Datum, Startzeit, schnellster Kilometer, Tempo
- **Elemente:** Pace-Farben, Tempo-Echo, Kilometermarken, Start & Ziel, Kartengrundlage
- **Diagramme:** Höhenprofil, Pace-Kurve, Km-Splits
- **Privatzone:** blendet Anfang und Ende der Strecke aus (die Kennzahlen bleiben vollständig)
- **Formate:** DIN A (1:√2), 50 × 70 cm, Quadrat
- **Export:** PNG bis A2 mit 300 dpi oder SVG (Schriften eingebettet, verlustfrei skalierbar)

## Kartengrundlage

Die Karte wird bei Bedarf live aus OpenStreetMap geladen (Overpass-API, `overpass-api.de`).
Dabei wird nur der Kartenausschnitt übertragen, nicht die Strecke.
Kartendaten © OpenStreetMap-Mitwirkende, ODbL; die Quellenangabe steht automatisch auf dem Poster.

## Aufbau

| Pfad | Inhalt |
| --- | --- |
| `src/laufspur.src.html` | Quellcode (HTML, CSS, JavaScript) |
| `src/build.py` | baut `index.html`: bettet Schriften und Beispiellauf ein |
| `fonts/` | Anybody, Chivo Mono, Hanken Grotesk (Lateinisch, woff2) |
| `beispiel/beispiellauf.gpx` | erfundener 10-km-Rundkurs mit erfundenen Zeiten |
| `index.html` | fertige, eigenständige Seite |

Nach Änderungen in `src/` neu bauen:

```
python3 src/build.py
```

Mit einer anderen GPX-Datei als Beispiel: `python3 src/build.py meinlauf.gpx index.html`.

## Lizenzen

Die Schriften Anybody, Chivo Mono und Hanken Grotesk stehen unter der SIL Open Font License 1.1 (Google Fonts).

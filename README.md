# Spurwerk

GPX rein, Poster raus. Spurwerk macht aus GPX-Dateien (Garmin, Apple Health, Strava-Export …) druckfertige Poster von Läufen, Radtouren und Wanderungen.

Früher hieß das Tool „Laufspur“; alte Einstellungsdateien lassen sich weiter laden.
Alles läuft im Browser; die GPX-Datei wird nirgends hochgeladen.

**Starten:** `index.html` im Browser öffnen oder über GitHub Pages aufrufen.

## Funktionen

- **Sportarten:** Laufen, Radfahren, Wandern – automatisch erkannt (GPX-Feld `type` oder Geschwindigkeit), von Hand umstellbar. Je Sportart passende Tempo-Angabe (Pace oder km/h), Abschnitte (1, 5 oder 10 km), Kilometermarken, Titelvorschläge und eigene Kennzahl-Auswahl
- **10 Vorlagen:** Tartan, Glut, Startnummer, Zielsprint, Stoppuhr, Riso, Medaille, Wellen, Pass (Höhenprofil in Steigungsfarben), Linienplan (Strecke als U-Bahn-Plan), jeweils mit zwei frei wählbaren Farben
- **Lauf-Liste und Jahresposter:** neue GPX-Dateien kommen zur Liste dazu; ab zwei Aktivitäten gibt es das Jahresposter (alle oder je Jahr), als Kacheln (jeder Lauf einzeln) oder als Heatmap (alle Läufe übereinander), mit Jahressummen
- **Kennzahlen nach Wahl:** Distanz, Zeit, Pace, Höhenmeter, Datum, Startzeit, schnellster Kilometer, Tempo, max. Tempo, höchster Punkt, max. Steigung, Ø Leistung, Ø Kadenz, Ø Puls, max. Puls, Platzierung, Startnummer
- **Offizielles Ergebnis:** Platzierung, Startnummer und offizielle Zeit (ersetzt die Zeit der Uhr)
- **Elemente:** Pace- oder Puls-Farben, Tempo-Echo, Kilometermarken, Start & Ziel, Kartengrundlage, Foto hinter der Strecke
- **Diagramme:** Höhenprofil, Pace-Kurve, Puls-Kurve, Km-Splits
- **Markierungen:** eigene Notizen per Klick auf die Strecke
- **Ausrichtung:** Strecke frei oder automatisch drehen (mit Nordpfeil)
- **Privatzone:** blendet Anfang und Ende der Strecke aus (die Kennzahlen bleiben vollständig)
- **Formate:** DIN A (A4–A2), 50 × 70 cm, Quadrat, Story 9:16
- **Export:** PNG mit 300 dpi, SVG (Schriften eingebettet) und Druck-PDF mit 3 mm Beschnitt
- **Meine Vorlage:** Einstellungen als JSON-Datei speichern und wieder laden; der Browser merkt sich die letzten Einstellungen zusätzlich

## Kartengrundlage

Die Karte wird bei Bedarf live aus OpenStreetMap geladen (Overpass-API, `overpass-api.de`).
Dabei wird nur der Kartenausschnitt übertragen, nicht die Strecke.
Kartendaten © OpenStreetMap-Mitwirkende, ODbL; die Quellenangabe steht automatisch auf dem Poster.

Das Druck-PDF lädt beim ersten Klick die Bibliothek jsPDF von cdnjs.

## Aufbau

| Pfad | Inhalt |
| --- | --- |
| `src/parts/` | Quellcode: `head.html` (CSS), `markup.html`, `core.js`, `draw.js`, `templates.js`, `app.js` |
| `src/build.py` | baut `index.html`: bettet Schriften und Beispiellauf ein |
| `fonts/` | Anybody, Chivo Mono, Hanken Grotesk (Lateinisch, woff2) |
| `beispiel/beispiellauf.gpx` | erfundener 10-km-Rundkurs mit erfundenen Zeiten und Pulswerten |
| `index.html` | fertige, eigenständige Seite |

Nach Änderungen in `src/` neu bauen:

```
python3 src/build.py
```

Mit einer anderen GPX-Datei als Beispiel: `python3 src/build.py meinlauf.gpx index.html`.

## Lizenzen

Die Schriften Anybody, Chivo Mono und Hanken Grotesk stehen unter der SIL Open Font License 1.1 (Google Fonts).

"""Baut die eigenständige index.html aus src/laufspur.src.html, den Schriften und einer GPX-Beispieldatei.

Aufruf:  python3 src/build.py [beispiel.gpx] [ausgabe.html]
"""
import base64, json, re, sys, datetime, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
gpx = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'beispiel' / 'beispiellauf.gpx'
out = pathlib.Path(sys.argv[2]) if len(sys.argv) > 2 else ROOT / 'index.html'

def sample(path):
    s = path.read_text(encoding='utf-8')
    pts = re.findall(r'<trkpt lat="([-\d.]+)" lon="([-\d.]+)">\s*<ele>([-\d.]+)</ele>\s*<time>([^<]+)</time>', s)
    if len(pts) > 2500:
        pts = pts[::2] + ([pts[-1]] if len(pts) % 2 == 0 else [])
    iso = lambda t: datetime.datetime.fromisoformat(t.replace('Z', '+00:00'))
    t0 = iso(pts[0][3]); d = []; pl = pa = pe = pt = 0
    for la, lo, e, t in pts:
        la = round(float(la) * 1e6); lo = round(float(lo) * 1e6); e = round(float(e) * 10)
        tt = int((iso(t) - t0).total_seconds())
        d += [la - pl, lo - pa, e - pe, tt - pt]; pl, pa, pe, pt = la, lo, e, tt
    meta = {k: float(v) for k, v in re.findall(r'<(totalTime|totalDistance|cumulativeClimb)>([\d.]+)<', s)}
    return {'t0': pts[0][3], 'd': d, 'meta': meta, 'file': path.name}

fonts = {k: base64.b64encode((ROOT / 'fonts' / f'{k}.woff2').read_bytes()).decode() for k in ['anyN', 'anyI', 'chivo', 'hanken']}
body = (ROOT / 'src' / 'laufspur.src.html').read_text(encoding='utf-8')
body = body.replace('__FONTS__', json.dumps(fonts)).replace('__SAMPLE__', json.dumps(sample(gpx), separators=(',', ':')))
if '--fragment' in sys.argv:
    out.write_text(body, encoding='utf-8')
else:
    out.write_text('<!doctype html><html lang="de"><head><meta charset="utf-8">'
                   '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>'
                   + body + '</body></html>\n', encoding='utf-8')
print(f'{out} geschrieben ({out.stat().st_size // 1024} KB)')

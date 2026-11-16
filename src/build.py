"""Baut die eigenständige index.html aus src/parts/, den Schriften und einer GPX-Beispieldatei.

Aufruf:  python3 src/build.py [beispiel.gpx] [ausgabe.html] [--fragment]
--fragment lässt das Dokument-Gerüst (doctype, head, body) weg.
"""
import base64, json, re, sys, datetime, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
PARTS = ROOT / 'src' / 'parts'
args = [a for a in sys.argv[1:] if not a.startswith('--')]
gpx = pathlib.Path(args[0]) if len(args) > 0 else ROOT / 'beispiel' / 'beispiellauf.gpx'
out = pathlib.Path(args[1]) if len(args) > 1 else ROOT / 'index.html'

def sample(path):
    s = path.read_text(encoding='utf-8')
    blocks = re.findall(r'<trkpt\b([^>]*)>(.*?)</trkpt>', s, re.S)
    pts = []
    for attrs, inner in blocks:
        la = re.search(r'lat="([-\d.]+)"', attrs); lo = re.search(r'lon="([-\d.]+)"', attrs)
        e = re.search(r'<ele>([-\d.]+)</ele>', inner); t = re.search(r'<time>([^<]+)</time>', inner)
        hr = re.search(r'<(?:\w+:)?hr>(\d+)</(?:\w+:)?hr>', inner)
        if la and lo and e and t:
            pts.append((la.group(1), lo.group(1), e.group(1), t.group(1), hr.group(1) if hr else None))
    if len(pts) > 2500:
        pts = pts[::2] + ([pts[-1]] if len(pts) % 2 == 0 else [])
    has_hr = all(p[4] for p in pts)
    iso = lambda t: datetime.datetime.fromisoformat(t.replace('Z', '+00:00'))
    t0 = iso(pts[0][3]); d = []; pl = pa = pe = pt = 0
    for la, lo, e, t, hr in pts:
        la = round(float(la) * 1e6); lo = round(float(lo) * 1e6); e = round(float(e) * 10)
        tt = int((iso(t) - t0).total_seconds())
        d += [la - pl, lo - pa, e - pe, tt - pt] + ([int(hr)] if has_hr else []); pl, pa, pe, pt = la, lo, e, tt
    meta = {k: float(v) for k, v in re.findall(r'<(totalTime|totalDistance|cumulativeClimb)>([\d.]+)<', s)}
    typ = re.search(r'<trk>.*?<type>([^<]*)</type>', s, re.S)
    return {'t0': pts[0][3], 'd': d, 'hr': has_hr, 'meta': meta, 'file': path.name, 'type': typ.group(1) if typ else ''}

fonts = {k: base64.b64encode((ROOT / 'fonts' / f'{k}.woff2').read_bytes()).decode() for k in ['anyN', 'anyI', 'chivo', 'hanken']}
read = lambda n: (PARTS / n).read_text(encoding='utf-8')
script = '\n'.join(read(n) for n in ['core.js', 'sports.js', 'draw.js', 'templates.js', 'app.js', 'legal.js'])
site = json.loads((ROOT / 'site.json').read_text(encoding='utf-8'))
jspdf = (ROOT / 'vendor' / 'jspdf.umd.min.js').read_text(encoding='utf-8')
body = read('head.html') + '\n' + read('markup.html') + '\n<script>\n' + jspdf + '\n</script>\n<script>\n' + script + '</script>\n'
body = body.replace('__FONTS__', json.dumps(fonts)).replace('__SAMPLE__', json.dumps(sample(gpx), separators=(',', ':'))).replace('__SITE__', json.dumps(site, ensure_ascii=False))
if '--fragment' in sys.argv:
    out.write_text(body, encoding='utf-8')
else:
    out.write_text('<!doctype html><html lang="de"><head><meta charset="utf-8">'
                   '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>'
                   + body + '</body></html>\n', encoding='utf-8')
print(f'{out} geschrieben ({out.stat().st_size // 1024} KB)')

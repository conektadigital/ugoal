"""Arma el mapa de archivos de app/dist para publicar el Artifact (solo lo nuevo o cambiado desde la última vez).
Escribe tools/publish-files.json. Uso: python publish_files.py"""
import hashlib, json, os, re
ROOT = os.path.dirname(os.path.abspath(__file__))
DIST = os.path.join(ROOT, '..', 'app', 'dist')
STATE = os.path.join(ROOT, 'published.json')
prev = json.load(open(STATE)) if os.path.exists(STATE) else {}
html = open(os.path.join(DIST, 'ugoal.html'), encoding='utf8').read()
assets = re.findall(r'assets/[^"]+', html)
files, now = {}, {}
for d in ('catalog', 'art', 'logos'):
    for f in os.listdir(os.path.join(DIST, d)):
        p = f'{d}/{f}'
        h = hashlib.md5(open(os.path.join(DIST, p), 'rb').read()).hexdigest()
        now[p] = h
        if prev.get(p) != h: files[p] = p
for a in assets: files[a] = a
for k in prev:
    if k.startswith('assets/') and k not in assets: files[k] = None
for a in assets: now[a] = 'x'
json.dump(files, open(os.path.join(ROOT, 'publish-files.json'), 'w'))
json.dump(now, open(STATE, 'w'))
print(len([v for v in files.values() if v]), 'archivos nuevos o cambiados')

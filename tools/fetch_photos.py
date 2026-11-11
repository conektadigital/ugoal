"""Busca foto real en Wikimedia Commons para cada producto del catálogo que todavía no tiene foto.
Guarda candidatos en tools/raw2/<id>.jpg y la info (autor, licencia, página) en tools/photo-cands.json.
Después, cut_photos.py recorta (productos) o encuadra (lugares) y escribe app/public/catalog/<id>.webp.
Uso: python fetch_photos.py [categoria ...]"""
import json, os, re, sys, time, unicodedata, urllib.parse, urllib.request

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, '..', 'app', 'src', 'data', 'cat')
RAW = os.path.join(ROOT, 'raw2')
OUT = os.path.join(ROOT, 'photo-cands.json')
UA = {'User-Agent': 'UGOAL-catalog/1.0 (personal savings app; photo lookup)'}
os.makedirs(RAW, exist_ok=True)

def slug(s):
    s = unicodedata.normalize('NFD', s)
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn').lower()
    return re.sub(r'^-|-$', '', re.sub(r'[^a-z0-9]+', '-', s))

def blocks():
    """Lee los textos del catálogo (mismo formato que categories.ts)."""
    files = {'autos': 'autos.ts', 'tech': 'tech.ts', 'moda': 'moda.ts', 'viajes': 'viajes.ts'}
    out = {}
    for cat, f in files.items():
        t = open(os.path.join(SRC, f), encoding='utf8').read()
        out[cat] = t[t.index('`') + 1: t.rindex('`')]
    t = open(os.path.join(SRC, 'otros.ts'), encoding='utf8').read()
    for m in re.finditer(r'export const (\w+) = `(.*?)`', t, re.S):
        out[m.group(1)] = m.group(2)
    return out

def items():
    seen = set()
    for cat, src in blocks().items():
        typ, group = cat, ''
        for raw in src.split('\n'):
            line = raw.strip()
            if not line: continue
            if line.startswith('#'): typ = line[1:].split(' ')[0]; continue
            if line.startswith('@'): group = line[1:].strip(); continue
            f = line.split('|')
            name, img, iid = f[0].strip(), (f[2] if len(f) > 2 else ''), (f[3] if len(f) > 3 else '')
            key = iid or f'{cat}-{slug(group)}-{slug(name)}'
            while key in seen: key += '-2'
            seen.add(key)
            if not img:
                yield dict(id=key, cat=cat, type=typ, group=group, name=name)

GENERIC = re.compile(r' y |armada|Setup|Lujo|Jerseys|Lentes|Perfumes|Bolsas|Joyería|Playas|Pueblos|Ciudades|Sala|Recámara|Cocina|Lavado|Home office|Clima|Exterior|Comprar|Mejorar|Bodas|Fiestas|Regalos|Comida|Servicios|Venta|Movilidad|Universidad|Prepa|Escuela|Dental|Vista|Estética|Bienestar|Tarjetas|Personas|Plan', re.I)

def query(it):
    n, g, c = it['name'], it['group'], it['cat']
    brand = '' if GENERIC.search(g) or n.lower().startswith(g.lower().split(' ')[0]) else g + ' '
    if c == 'autos': return f'{brand}{n}' + (' motorcycle' if it['type'] == 'motos' else ' car')
    if c == 'viajes': return n + ' landmark'
    return f'{brand}{n}'

def search(q):
    p = {'action': 'query', 'format': 'json', 'generator': 'search', 'gsrsearch': f'filetype:bitmap {q}', 'gsrnamespace': 6, 'gsrlimit': 12,
         'prop': 'imageinfo', 'iiprop': 'url|size|mime|extmetadata', 'iiurlwidth': 960}
    url = 'https://commons.wikimedia.org/w/api.php?' + urllib.parse.urlencode(p)
    for k in range(4):
        try:
            return json.loads(urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=40).read())
        except Exception as e:
            time.sleep(4 * (k + 1))
    return {}

def pick(res, cat):
    pages = sorted(res.get('query', {}).get('pages', {}).values(), key=lambda p: p.get('index', 99))
    for p in pages:
        ii = (p.get('imageinfo') or [{}])[0]
        w, h = ii.get('width', 0), ii.get('height', 0)
        if ii.get('mime') not in ('image/jpeg', 'image/png', 'image/webp'): continue
        if min(w, h) < 600: continue
        title = p.get('title', '').lower()
        if any(b in title for b in ('logo', 'map', 'diagram', 'interior', 'dashboard', 'engine', 'badge', 'emblem', 'chart', 'flag', 'coat of arms', 'svg')): continue
        if cat == 'autos' and w < h: continue  # coches: foto horizontal
        meta = ii.get('extmetadata', {})
        lic = meta.get('LicenseShortName', {}).get('value', '')
        if not lic or 'fair' in lic.lower(): continue
        artist = re.sub('<[^>]+>', '', meta.get('Artist', {}).get('value', '')).strip()
        return dict(url=ii.get('thumburl') or ii['url'], page=ii.get('descriptionurl', ''), license=lic, author=artist[:120], title=p.get('title'))
    return None

def main():
    import threading
    from concurrent.futures import ThreadPoolExecutor
    cats = set(sys.argv[1:])
    done = json.load(open(OUT, encoding='utf8')) if os.path.exists(OUT) else {}
    # reintenta los que fallaron (antes las miniaturas grandes se bloqueaban)
    done = {k: v for k, v in done.items() if not v.get('missing') or v.get('noresult')}
    todo = [i for i in items() if (not cats or i['cat'] in cats) and i['id'] not in done]
    print(len(todo), 'por buscar', flush=True)
    lock = threading.Lock()
    count = [0]
    def work(it):
        q = query(it)
        c = pick(search(q), it['cat'])
        rec = {'missing': True, 'noresult': True, **it, 'q': q}
        if c:
            dest = os.path.join(RAW, it['id'] + '.jpg')
            for k in range(3):
                try:
                    data = urllib.request.urlopen(urllib.request.Request(c['url'], headers=UA), timeout=30).read()
                    open(dest, 'wb').write(data)
                    rec = {**c, **it, 'q': q}
                    break
                except Exception:
                    rec = {'missing': True, **it, 'q': q}
                    time.sleep(3 * (k + 1))
        with lock:
            done[it['id']] = rec
            count[0] += 1
            if count[0] % 10 == 0:
                json.dump(done, open(OUT, 'w', encoding='utf8'), ensure_ascii=False, indent=0)
                print(count[0], it['id'], 'ok' if not rec.get('missing') else 'sin foto', flush=True)
        time.sleep(0.5)
    with ThreadPoolExecutor(4) as ex:
        list(ex.map(work, todo))
    json.dump(done, open(OUT, 'w', encoding='utf8'), ensure_ascii=False, indent=0)
    print('listo', sum(1 for v in done.values() if not v.get('missing')), 'con foto de', len(done), flush=True)

if __name__ == '__main__':
    main()

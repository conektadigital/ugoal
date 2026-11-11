"""Procesa las fotos encontradas por fetch_photos.py:
- Productos (coches, moda, tecnología): recorta el fondo con rembg y deja el objeto centrado (WebP con transparencia).
- Lugares y lo demás: encuadre vertical 3:4.
Escribe app/public/catalog/<id>.webp, app/src/data/photos.json (id → archivo) y suma créditos a creditos.json.
También arma hojas de contacto (tools/sheet2-<cat>-N.jpg) para revisar a ojo. Uso: python -I cut_photos.py"""
import json, os, site, sys
sys.path.append(site.getusersitepackages())
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(ROOT, 'raw2')
OUT = os.path.join(ROOT, '..', 'app', 'public', 'catalog')
MAP = os.path.join(ROOT, '..', 'app', 'src', 'data', 'photos.json')
CRED = os.path.join(OUT, 'creditos.json')
CANDS = json.load(open(os.path.join(ROOT, 'photo-cands.json'), encoding='utf8'))
BAD = set(json.load(open(os.path.join(ROOT, 'photo-bad.json'), encoding='utf8'))) if os.path.exists(os.path.join(ROOT, 'photo-bad.json')) else set()
CUT = {'autos', 'moda', 'tech'}

from rembg import new_session, remove
session = new_session(os.environ.get('REMBG_MODEL', 'silueta'))

photos = json.load(open(MAP, encoding='utf8')) if os.path.exists(MAP) else {}
credits = json.load(open(CRED, encoding='utf8'))
done = 0
for iid, c in CANDS.items():
    if c.get('missing') or iid in BAD:
        photos.pop(iid, None); continue
    src = os.path.join(RAW, iid + '.jpg')
    name = iid + '.webp'
    dest = os.path.join(OUT, name)
    if not os.path.exists(src): continue
    if iid in photos and os.path.exists(dest): continue
    try:
        im = Image.open(src).convert('RGB')
    except Exception:
        continue
    if c['cat'] in CUT:
        im.thumbnail((640, 640))
        cut = remove(im, session=session, post_process_mask=True)
        bbox = cut.getchannel('A').point(lambda a: 255 if a > 24 else 0).getbbox()
        if not bbox: continue
        cut = cut.crop(bbox)
        # si el recorte se comió casi todo, no sirve
        if cut.width * cut.height < 0.06 * im.width * im.height: continue
        cut.thumbnail((800, 800), Image.LANCZOS)
        cut.save(dest, 'WEBP', quality=84, method=6)
        photos[iid] = {'img': name, 'mode': 'cut'}
    else:
        w, h = im.size; tw = min(w, int(h * 3 / 4))
        im = im.crop(((w - tw) // 2, 0, (w - tw) // 2 + tw, h))
        im.thumbnail((800, 1066), Image.LANCZOS)
        im.save(dest, 'WEBP', quality=78, method=6)
        photos[iid] = {'img': name, 'mode': 'full'}
    credits[iid] = {'source': 'Wikimedia Commons', 'license': c.get('license', ''), 'author': c.get('author', ''), 'link': c.get('page', '')}
    done += 1
    if done % 20 == 0:
        print(done, iid, flush=True)
        json.dump(photos, open(MAP, 'w', encoding='utf8'), ensure_ascii=False, indent=0)

json.dump(photos, open(MAP, 'w', encoding='utf8'), ensure_ascii=False, indent=0)
json.dump(credits, open(CRED, 'w', encoding='utf8'), ensure_ascii=False, indent=1)

# Hojas de contacto para revisar
bycat = {}
index = {}
for iid, p in photos.items():
    bycat.setdefault(CANDS.get(iid, {}).get('cat', 'x'), []).append(iid)
for cat, ids in bycat.items():
    for k in range(0, len(ids), 48):
        chunk = ids[k:k + 48]
        sheet = Image.new('RGB', (8 * 200, ((len(chunk) + 7) // 8) * 230), (24, 26, 30))
        d = ImageDraw.Draw(sheet)
        for n, iid in enumerate(chunk):
            try:
                t = Image.open(os.path.join(OUT, photos[iid]['img'])).convert('RGBA')
            except Exception:
                continue
            t.thumbnail((190, 190))
            bg = Image.new('RGBA', (190, 190), (40, 44, 50, 255)); bg.alpha_composite(t, ((190 - t.width) // 2, (190 - t.height) // 2))
            x, y = (n % 8) * 200 + 5, (n // 8) * 230 + 5
            sheet.paste(bg.convert('RGB'), (x, y))
            d.text((x, y + 193), f"{n} {CANDS[iid]['name'][:26]}", fill=(230, 230, 230))
        sheet.save(os.path.join(ROOT, f'sheet2-{cat}-{k // 48}.jpg'), quality=80)
        index[f'{cat}-{k // 48}'] = chunk
json.dump(index, open(os.path.join(ROOT, 'sheet2-index.json'), 'w'), indent=0)
print('listo', done, 'nuevas;', len(photos), 'en total', flush=True)

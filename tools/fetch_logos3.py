"""Tercer intento: logo (propiedad P154) en Wikidata, archivo en Commons. Uso: python -I fetch_logos3.py"""
import io, json, os, re, site, sys, time, urllib.parse, urllib.request
sys.path.append(site.getusersitepackages())
from PIL import Image
from fetch_logos2 import ART, OUT, MAP, UA
def j(url):
    for k in range(3):
        try: return json.loads(urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=40).read())
        except Exception: time.sleep(3)
    return {}
logos = json.load(open(MAP, encoding='utf8')); miss = []
for brand, art in ART.items():
    if brand in logos: continue
    d = j('https://www.wikidata.org/w/api.php?' + urllib.parse.urlencode({'action': 'wbgetentities', 'sites': 'enwiki', 'titles': art, 'props': 'claims', 'format': 'json', 'redirects': 'yes'}))
    ents = list(d.get('entities', {}).values())
    claims = ents[0].get('claims', {}) if ents else {}
    f = None
    for c in claims.get('P154', []):
        f = c.get('mainsnak', {}).get('datavalue', {}).get('value')
        if f: break
    if not f: miss.append(brand); continue
    ii = j('https://commons.wikimedia.org/w/api.php?' + urllib.parse.urlencode({'action': 'query', 'format': 'json', 'titles': 'File:' + f, 'prop': 'imageinfo', 'iiprop': 'url', 'iiurlwidth': 500}))
    pages = list(ii.get('query', {}).get('pages', {}).values())
    url = pages and (pages[0].get('imageinfo') or [{}])[0].get('thumburl')
    if not url: miss.append(brand); continue
    try:
        im = Image.open(io.BytesIO(urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=40).read())).convert('RGBA')
        bb = im.getchannel('A').getbbox()
        if bb: im = im.crop(bb)
        im.thumbnail((420, 220), Image.LANCZOS)
        name = re.sub(r'[^a-z0-9]+', '-', brand.lower()).strip('-') + '.png'
        im.save(os.path.join(OUT, name), optimize=True)
        logos[brand] = {'img': name, 'title': brand}; print('ok', brand, f, flush=True)
    except Exception: miss.append(brand)
    time.sleep(0.3)
json.dump(logos, open(MAP, 'w', encoding='utf8'))
print('faltan', miss)

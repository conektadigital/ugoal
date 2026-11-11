"""Segundo intento de logos: toma el logo del recuadro (infobox) del artículo de Wikipedia en inglés.
Uso: python -I fetch_logos2.py"""
import io, json, os, re, site, sys, time, urllib.parse, urllib.request
sys.path.append(site.getusersitepackages())
from PIL import Image

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, '..', 'app', 'public', 'logos')
MAP = os.path.join(ROOT, '..', 'app', 'src', 'data', 'logos.json')
UA = {'User-Agent': 'UGOAL-catalog/1.0 (personal savings app; logo lookup)'}
ART = {
  'Chirey': 'Chery', 'BYD': 'BYD Auto', 'GWM': 'Great Wall Motor', 'JAC': 'JAC Group', 'Dodge': 'Dodge', 'Cupra': 'Cupra (automobile brand)',
  'Royal Enfield': 'Royal Enfield', 'Vento': 'Vento Motorcycles', 'Triumph': 'Triumph Motorcycles Ltd', 'Bajaj': 'Bajaj Auto', 'TVS': 'TVS Motor Company',
  'Omoda': 'Omoda', 'GAC': 'GAC Group', 'Changan': 'Changan Automobile', 'Lincoln': 'Lincoln Motor Company', 'Land Rover': 'Land Rover', 'Alfa Romeo': 'Alfa Romeo',
  'Amazon': 'Amazon (company)', 'Xbox': 'Xbox', 'Hisense': 'Hisense', 'GoPro': 'GoPro', 'Nothing': 'Nothing (technology company)', 'Vans': 'Vans',
  'Converse': 'Converse (shoe company)', 'Onitsuka': 'Onitsuka Tiger', 'Hoka': 'Hoka One One', 'Salomon': 'Salomon Group', 'Supreme': 'Supreme (brand)',
  'Essentials': 'Fear of God (fashion label)', 'Ralph Lauren': 'Ralph Lauren Corporation', 'Lacoste': 'Lacoste', 'Stone Island': 'Stone Island',
  "Arc'teryx": "Arc'teryx", 'Citizen': 'Citizen Watch', 'Swatch': 'Swatch', 'Tissot': 'Tissot', 'TAG Heuer': 'TAG Heuer', 'Omega': 'Omega SA', 'New Era': 'New Era Cap Company',
  'Jaecoo': 'Jaecoo', 'Jetour': 'Jetour', 'Geely': 'Geely Auto', 'Kawasaki': 'Kawasaki Motors', 'Harley-Davidson': 'Harley-Davidson', 'Italika': 'Italika',
  'Mercedes-Benz': 'Mercedes-Benz', 'RAM': 'Ram Trucks', 'Lexus': 'Lexus', 'Marshall': 'Marshall Amplification', 'Nintendo': 'Nintendo', 'TCL': 'TCL Technology',
  'Asics': 'Asics', 'On': 'On (company)', 'Carhartt': 'Carhartt', "Levi's": "Levi Strauss & Co.", 'Casio': 'Casio', 'Seiko': 'Seiko', 'Rolex': 'Rolex',
}
API = 'https://en.wikipedia.org/w/api.php?'
def get(params):
    for k in range(3):
        try: return json.loads(urllib.request.urlopen(urllib.request.Request(API + urllib.parse.urlencode(params), headers=UA), timeout=40).read())
        except Exception: time.sleep(3)
    return {}

logos = json.load(open(MAP, encoding='utf8'))
miss = []
for brand, art in ART.items():
    if brand in logos: continue
    r = get({'action': 'parse', 'format': 'json', 'page': art, 'prop': 'wikitext', 'section': 0, 'redirects': 1})
    wt = r.get('parse', {}).get('wikitext', {}).get('*', '')
    m = re.search(r'\|\s*logo\s*=\s*(?:\[\[)?(?:File:|Image:)?([^\n|\]{}]+\.(?:svg|png|jpg))', wt, re.I)
    if not m: miss.append(brand); continue
    fname = m.group(1).strip()
    ii = get({'action': 'query', 'format': 'json', 'titles': 'File:' + fname, 'prop': 'imageinfo', 'iiprop': 'url', 'iiurlwidth': 500})
    pages = list(ii.get('query', {}).get('pages', {}).values())
    url = pages and (pages[0].get('imageinfo') or [{}])[0].get('thumburl')
    if not url: miss.append(brand); continue
    try:
        data = urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=40).read()
        im = Image.open(io.BytesIO(data)).convert('RGBA')
        bbox = im.getchannel('A').getbbox()
        if bbox: im = im.crop(bbox)
        im.thumbnail((420, 220), Image.LANCZOS)
        name = re.sub(r'[^a-z0-9]+', '-', brand.lower()).strip('-') + '.png'
        im.save(os.path.join(OUT, name), optimize=True)
        logos[brand] = {'img': name, 'title': brand}
        print('ok', brand, fname, flush=True)
    except Exception:
        miss.append(brand)
    time.sleep(0.3)
json.dump(logos, open(MAP, 'w', encoding='utf8'))
print('faltan', miss)

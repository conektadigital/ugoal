"""Logos que no vienen en Simple Icons: los busca en Wikimedia Commons (SVG → PNG 500px) y los agrega a app/src/data/logos.json.
Uso: python -I fetch_logos.py"""
import io, json, os, re, site, sys, time, urllib.parse, urllib.request
sys.path.append(site.getusersitepackages())
from PIL import Image

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, '..', 'app', 'public', 'logos')
MAP = os.path.join(ROOT, '..', 'app', 'src', 'data', 'logos.json')
os.makedirs(OUT, exist_ok=True)
UA = {'User-Agent': 'UGOAL-catalog/1.0 (personal savings app; logo lookup)'}
# marca del catálogo → búsqueda
WANT = {
  'Chirey': 'Chery logo', 'BYD': 'BYD Auto logo', 'GWM': 'Great Wall Motors logo', 'JAC': 'JAC Motors logo', 'Dodge': 'Dodge logo', 'RAM': 'Ram Trucks logo',
  'Cupra': 'Cupra logo', 'Mercedes-Benz': 'Mercedes-Benz logo star', 'Italika': 'Italika logo', 'Kawasaki': 'Kawasaki Motors logo', 'Harley-Davidson': 'Harley-Davidson logo',
  'Royal Enfield': 'Royal Enfield logo', 'Vento': 'Vento Motorcycles logo', 'Triumph': 'Triumph Motorcycles logo', 'Bajaj': 'Bajaj Auto logo', 'TVS': 'TVS Motor logo',
  'Omoda': 'Omoda logo', 'Jaecoo': 'Jaecoo logo', 'Geely': 'Geely logo', 'GAC': 'GAC Group logo', 'Changan': 'Changan Automobile logo', 'Jetour': 'Jetour logo',
  'Lexus': 'Lexus logo', 'Lincoln': 'Lincoln Motor Company logo', 'Land Rover': 'Land Rover logo', 'Alfa Romeo': 'Alfa Romeo logo', 'Amazon': 'Amazon logo',
  'Xbox': 'Xbox logo', 'Nintendo': 'Nintendo logo', 'Marshall': 'Marshall Amplification logo', 'TCL': 'TCL logo', 'Hisense': 'Hisense logo', 'GoPro': 'GoPro logo',
  'Nothing': 'Nothing Technology logo', 'Vans': 'Vans logo', 'Converse': 'Converse logo', 'Asics': 'Asics logo', 'Onitsuka': 'Onitsuka Tiger logo', 'On': 'On Running logo',
  'Hoka': 'Hoka One One logo', 'Salomon': 'Salomon Group logo', 'Supreme': 'Supreme brand logo', 'Essentials': 'Fear of God logo', 'Ralph Lauren': 'Ralph Lauren logo',
  'Lacoste': 'Lacoste logo', 'Stone Island': 'Stone Island logo', "Arc'teryx": "Arc'teryx logo", 'Carhartt': 'Carhartt logo', "Levi's": "Levi's logo",
  'Casio': 'Casio logo', 'Seiko': 'Seiko logo', 'Citizen': 'Citizen Watch logo', 'Swatch': 'Swatch logo', 'Tissot': 'Tissot logo', 'TAG Heuer': 'TAG Heuer logo',
  'Omega': 'Omega SA logo', 'Rolex': 'Rolex logo', 'New Era': 'New Era Cap logo',
}

def search(q):
    p = {'action': 'query', 'format': 'json', 'generator': 'search', 'gsrsearch': f'filetype:drawing {q}', 'gsrnamespace': 6, 'gsrlimit': 10,
         'prop': 'imageinfo', 'iiprop': 'url|size|mime', 'iiurlwidth': 500}
    url = 'https://commons.wikimedia.org/w/api.php?' + urllib.parse.urlencode(p)
    for k in range(3):
        try: return json.loads(urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=40).read())
        except Exception: time.sleep(3)
    return {}

logos = json.load(open(MAP, encoding='utf8'))
miss = []
for brand, q in WANT.items():
    if brand in logos: continue
    res = search(q)
    pages = sorted(res.get('query', {}).get('pages', {}).values(), key=lambda p: p.get('index', 99))
    tok = re.sub(r'[^a-z]', '', brand.lower().split(' ')[0])[:5]
    got = None
    for p in pages:
        t = re.sub(r'[^a-z]', '', p.get('title', '').lower())
        if 'logo' not in t or tok not in t: continue
        ii = (p.get('imageinfo') or [{}])[0]
        if not ii.get('thumburl'): continue
        got = ii; break
    if not got: miss.append(brand); continue
    try:
        data = urllib.request.urlopen(urllib.request.Request(got['thumburl'], headers=UA), timeout=40).read()
        im = Image.open(io.BytesIO(data)).convert('RGBA')
        bbox = im.getchannel('A').getbbox()
        if bbox: im = im.crop(bbox)
        im.thumbnail((420, 220), Image.LANCZOS)
        name = re.sub(r'[^a-z0-9]+', '-', brand.lower()).strip('-') + '.png'
        im.save(os.path.join(OUT, name), optimize=True)
        logos[brand] = {'img': name, 'title': brand}
        print('ok', brand, flush=True)
    except Exception as e:
        miss.append(brand)
    time.sleep(0.4)
json.dump(logos, open(MAP, 'w', encoding='utf8'))
print('faltan', miss)

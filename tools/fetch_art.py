"""Fotos reales (Wikimedia Commons) para categorías, insignias y vicios: reemplazan los emojis.
Guarda app/public/art/<clave>.webp (cuadradas 720px) y créditos en app/public/art/creditos.json.
Uso: python -I fetch_art.py [clave ...]   (para rehacer una: python -I fetch_art.py clave=otra búsqueda)"""
import io, json, os, re, site, sys, time, urllib.parse, urllib.request
sys.path.append(site.getusersitepackages())
from PIL import Image

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, '..', 'app', 'public', 'art')
os.makedirs(OUT, exist_ok=True)
UA = {'User-Agent': 'UGOAL-catalog/1.0 (personal savings app; photo lookup)'}
ART = {
  # categorías
  'cat-autos': 'sports car road sunset', 'cat-tech': 'smartphone laptop desk', 'cat-moda': 'sneakers Nike Air Jordan shoes',
  'cat-casa': 'modern living room interior', 'cat-viajes': 'Los Cabos arch beach', 'cat-eventos': 'wedding reception party lights',
  'cat-finanzas': 'Mexican peso coins banknotes', 'cat-deudas': 'credit cards wallet', 'cat-negocio': 'taco stand Mexico street food',
  'cat-escuela': 'university graduation ceremony caps', 'cat-fisico': 'runner marathon road', 'cat-salud': 'dentist dental clinic',
  'cat-estudios': 'books library reading', 'cat-vicios': 'broken cigarette',
  # insignias
  'b-primera-meta': 'seedling sprout soil', 'b-primer-aporte': 'piggy bank coins', 'b-carta': 'handwritten letter envelope',
  'b-racha-4': 'campfire flames night', 'b-racha-12': 'rocket launch', 'b-ahorro-10k': 'stack of banknotes', 'b-ahorro-100k': 'gold bars',
  'b-cumplida-1': 'trophy cup gold', 'b-cumplida-5': 'crown jewels', 'b-fondo': 'umbrella rain', 'b-deuda': 'broken chain',
  'b-vicio-7': 'sunrise mountain', 'b-vicio-30': 'mountain summit climber', 'b-estudio-10': 'student studying desk lamp',
  'b-fisico-10': 'dumbbells gym', 'b-reto': 'gold medal ribbon', 'b-tanda': 'handshake', 'b-negocio': 'shop open sign',
  'b-pareja': 'couple holding hands sunset',
  # vicios
  'v-cigarro': 'cigarette ashtray smoke', 'v-vape': 'electronic cigarette vape', 'v-alcohol': 'whisky glass bar', 'v-refresco': 'cola soft drink glass ice',
  'v-azucar': 'candy sweets colorful', 'v-apuestas': 'casino poker chips', 'v-redes': 'smartphone social media scrolling', 'v-chatarra': 'hamburger fries fast food',
  'v-videojuegos': 'video game controller', 'v-cafe': 'espresso coffee cup', 'v-compras': 'shopping bags mall', 'v-unas': 'fingernails hand close',
  'v-series': 'television remote couch', 'v-refresco-dieta': 'soda can', 'v-domicilio': 'food delivery motorcycle', 'v-pan': 'conchas pan dulce mexicano',
  'v-fines': 'beer glasses bar', 'v-mariguana': 'cannabis plant leaf', 'v-cocaina': 'cocaine seized police', 'v-cristal': 'methamphetamine crystal',
  'v-otro': 'stop sign',
}

def search(q):
    p = {'action': 'query', 'format': 'json', 'generator': 'search', 'gsrsearch': f'filetype:bitmap {q}', 'gsrnamespace': 6, 'gsrlimit': 15,
         'prop': 'imageinfo', 'iiprop': 'url|size|mime|extmetadata', 'iiurlwidth': 960}
    url = 'https://commons.wikimedia.org/w/api.php?' + urllib.parse.urlencode(p)
    for k in range(4):
        try: return json.loads(urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=40).read())
        except Exception: time.sleep(3 * (k + 1))
    return {}

def candidates(res, skip=0):
    pages = sorted(res.get('query', {}).get('pages', {}).values(), key=lambda p: p.get('index', 99))
    n = 0
    for p in pages:
        ii = (p.get('imageinfo') or [{}])[0]
        if ii.get('mime') not in ('image/jpeg', 'image/png', 'image/webp'): continue
        if min(ii.get('width', 0), ii.get('height', 0)) < 700: continue
        t = p.get('title', '').lower()
        if any(b in t for b in ('logo', 'map', 'diagram', 'chart', 'flag', 'svg', 'icon')): continue
        lic = ii.get('extmetadata', {}).get('LicenseShortName', {}).get('value', '')
        if not lic: continue
        if n < skip: n += 1; continue
        art = re.sub('<[^>]+>', '', ii.get('extmetadata', {}).get('Artist', {}).get('value', '')).strip()[:120]
        return dict(url=ii.get('thumburl') or ii['url'], page=ii.get('descriptionurl', ''), license=lic, author=art)
    return None

credf = os.path.join(OUT, 'creditos.json')
cred = json.load(open(credf, encoding='utf8')) if os.path.exists(credf) else {}
args = sys.argv[1:]
todo = {}
for a in args:
    k, _, q = a.partition('=')
    skip = 0
    if '#' in k: k, s = k.split('#'); skip = int(s)
    todo[k] = (q or ART[k], skip)
if not args:
    todo = {k: (q, 0) for k, q in ART.items() if not os.path.exists(os.path.join(OUT, k + '.webp'))}
for k, (q, skip) in todo.items():
    c = candidates(search(q), skip)
    if not c: print('sin foto', k, q, flush=True); continue
    try:
        data = urllib.request.urlopen(urllib.request.Request(c['url'], headers=UA), timeout=40).read()
        im = Image.open(io.BytesIO(data)).convert('RGB')
        w, h = im.size; s = min(w, h)
        im = im.crop(((w - s) // 2, (h - s) // 2, (w - s) // 2 + s, (h - s) // 2 + s)).resize((720, 720), Image.LANCZOS)
        im.save(os.path.join(OUT, k + '.webp'), 'WEBP', quality=80, method=6)
        cred[k] = {'source': 'Wikimedia Commons', 'license': c['license'], 'author': c['author'], 'link': c['page']}
        print('ok', k, flush=True)
    except Exception as e:
        print('error', k, e, flush=True)
    time.sleep(0.6)
json.dump(cred, open(credf, 'w', encoding='utf8'), ensure_ascii=False, indent=1)

# hoja de contacto
keys = sorted(f[:-5] for f in os.listdir(OUT) if f.endswith('.webp'))
from PIL import ImageDraw
sheet = Image.new('RGB', (8 * 180, ((len(keys) + 7) // 8) * 205), (24, 26, 30)); d = ImageDraw.Draw(sheet)
for n, k in enumerate(keys):
    t = Image.open(os.path.join(OUT, k + '.webp')).convert('RGB'); t.thumbnail((170, 170))
    x, y = (n % 8) * 180 + 5, (n // 8) * 205 + 5
    sheet.paste(t, (x, y)); d.text((x, y + 175), k, fill=(230, 230, 230))
sheet.save(os.path.join(ROOT, 'sheet-art.jpg'), quality=82)
print('listo', len(keys))

"""Arma el catálogo final de UGOAL.
- Lee catalog-src.json (nombres), picks.json (foto elegida) y los candidatos de Unsplash/Wikimedia.
- Productos (coches, moda, tecnología): recorta el fondo con rembg y deja el objeto centrado sobre transparente (.webp).
- Viajes, casa, físico, finanzas, estudios: foto completa recortada a 3:4 (.webp).
- Escribe app/public/catalog/*.webp, app/src/data/catalog.json y app/public/catalog/creditos.json
"""
import io, json, os, site, sys, time, urllib.parse, urllib.request
sys.path.append(site.getusersitepackages())  # rembg vive en los paquetes de usuario
from concurrent.futures import ThreadPoolExecutor
from PIL import Image

ROOT = os.path.dirname(os.path.abspath(__file__))
APP = os.path.join(ROOT, "..", "app")
OUT = os.path.join(APP, "public", "catalog")
RAW = os.path.join(ROOT, "raw")
os.makedirs(OUT, exist_ok=True); os.makedirs(RAW, exist_ok=True)
UA = {"User-Agent": "UGOAL-app/0.1 (personal project)"}

src = json.load(open(os.path.join(ROOT, "catalog-src.json"), encoding="utf-8"))
picks = json.load(open(os.path.join(ROOT, "picks.json"), encoding="utf-8"))
cands = json.load(open(os.path.join(ROOT, "cands.json"), encoding="utf-8"))
extra = {}
for line in open(os.path.join(ROOT, "unsplash-cands2.txt"), encoding="utf-8").read().strip().split(";"):
    k, v = line.split("="); extra[k] = ["photo-" + x for x in v.split(",") if x]

CUT = {"autos", "moda", "tech"}
# Elegidos de la segunda búsqueda (índice en unsplash-cands2) y nombres para los nuevos
EXTRA_PICKS = {
    "tech/mba": 1, "tech/iphone16pro": 0, "tech/iphone16": 3, "tech/mbp": 1, "tech/ipad-air": 2, "tech/galaxy-s24": 2,
    "tech/sony-xm5": 1, "tech/airpods-pro": 1, "tech/ps5": 1, "tech/xbox-sx": 1, "tech/gopro": 0, "tech/apple-watch": 0,
    "tech/dji-mini": 3, "tech/imac": 3,
    "moda/campus": 2, "moda/backpack": 0, "moda/yeezy": 1, "moda/wayfarer": 0, "moda/asics": 0, "moda/aj4": 3, "moda/blazer": 2, "moda/rolex": 1,
}
NAMES = {  # id: (nombre, marca) para ajustar o agregar
    "ipad-air": ("iPad", "Apple"), "galaxy-s24": ("Samsung Galaxy S", "Samsung"), "sony-xm5": ("Audífonos Sony", "Sony"),
    "dji-mini": ("Dron DJI", "DJI"), "switch-oled": ("Nintendo Switch", "Nintendo"), "pixel8": ("Google Pixel", "Google"),
    "campus": ("Adidas Campus", "Adidas"), "backpack": ("Mochila urbana", "Mochila"), "yeezy": ("Adidas Yeezy Boost 350", "Adidas"),
    "wayfarer": ("Ray-Ban Wayfarer", "Ray-Ban"), "asics": ("Asics Gel", "Asics"), "aj4": ("Air Jordan 4", "Jordan"),
    "blazer": ("Nike Blazer Mid", "Nike"), "rolex": ("Rolex Submariner", "Rolex"), "nb530": ("New Balance 530", "New Balance"),
    "seiko5": ("Seiko 5 Sports", "Seiko"), "prx": ("Tissot PRX", "Tissot"), "nuptse": ("Chamarra puffer", "The North Face"),
    "gshock": ("Casio G-Shock", "Casio"), "suede": ("Puma Suede", "Puma"), "airpods-max": ("AirPods Max", "Apple"),
}

def get(url, tries=4):
    for a in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=90) as r: return r.read()
        except Exception:
            if a == tries - 1: raise
            time.sleep(6 * (a + 1))

def resolve(cat, id_):
    k = f"{cat}/{id_}"
    if k in EXTRA_PICKS:
        ref = extra[k][EXTRA_PICKS[k]]
        return {"kind": "unsplash", "ref": ref}
    if k not in picks: return None
    p = picks[k]
    if isinstance(p, list): return cands[p[0]][p[1]]
    lst = cands.get(k) or []
    return lst[p] if p < len(lst) else None

items, seen = [], set()
order ={c: [r[0] for r in rows] for c, rows in src.items()}
names = {(c, r[0]): (r[1], r[2]) for c, rows in src.items() for r in rows}
for k in EXTRA_PICKS:
    c, i = k.split("/")
    if i not in order[c]: order[c].append(i)
for cat, ids in order.items():
    for id_ in ids:
        c = resolve(cat, id_)
        if not c: continue
        n, b = NAMES.get(id_) or names.get((cat, id_)) or (id_, "")
        uid_ = id_ if id_ not in seen else f"{cat}-{id_}"
        seen.add(uid_)
        items.append({"id": uid_, "cat": cat, "name": n, "brand": b, "src": c})

def fetch(it):
    f = os.path.join(RAW, f"{it['cat']}_{it['id']}.jpg")
    if not os.path.exists(f):
        c = it["src"]
        url = (f"https://images.unsplash.com/{c['ref']}?w=1400&q=85&fm=jpg" if c["kind"] == "unsplash"
               else "https://commons.wikimedia.org/wiki/Special:FilePath/" + urllib.parse.quote(c["ref"]) + "?width=1400")
        open(f, "wb").write(get(url))
        if c["kind"] == "commons": time.sleep(2)
    return f

print("descargando", len(items))
with ThreadPoolExecutor(4) as ex: raws = list(ex.map(fetch, items))

session = None
try:
    from rembg import new_session, remove
    session = new_session("isnet-general-use")
except ImportError:
    print("rembg no está listo: por ahora solo proceso las fotos completas")
    items, raws = zip(*[(it, f) for it, f in zip(items, raws) if it["cat"] not in CUT]) if items else ([], [])

credits, out = {}, []
for it, f in zip(items, raws):
    im = Image.open(f).convert("RGB")
    name = f"{it['id']}.webp"
    if it["cat"] in CUT:
        cut = remove(im, session=session, post_process_mask=True)
        bbox = cut.getchannel("A").point(lambda a: 255 if a > 24 else 0).getbbox()
        if bbox: cut = cut.crop(bbox)
        cut.thumbnail((900, 900), Image.LANCZOS)
        cut.save(os.path.join(OUT, name), "WEBP", quality=86, method=6)
        mode = "cut"
    else:
        w, h = im.size; tw = min(w, int(h * 3 / 4))
        im = im.crop(((w - tw) // 2, 0, (w - tw) // 2 + tw, h))
        im.thumbnail((900, 1200), Image.LANCZOS)
        im.save(os.path.join(OUT, name), "WEBP", quality=80, method=6)
        mode = "full"
    c = it["src"]
    credits[it["id"]] = {"source": "Unsplash" if c["kind"] == "unsplash" else "Wikimedia Commons",
                         "license": "Licencia Unsplash" if c["kind"] == "unsplash" else c.get("license", "CC BY-SA"),
                         "link": f"https://images.unsplash.com/{c['ref']}" if c["kind"] == "unsplash" else "https://commons.wikimedia.org/wiki/File:" + urllib.parse.quote(c["ref"].replace(" ", "_"))}
    out.append({"id": it["id"], "cat": it["cat"], "name": it["name"], "brand": it["brand"], "img": name, "mode": mode})
    print("ok", it["cat"], it["id"], mode, flush=True)

json.dump(out, open(os.path.join(APP, "src", "data", "catalog.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
json.dump(credits, open(os.path.join(OUT, "creditos.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("listo", len(out))

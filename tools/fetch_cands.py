"""Descarga miniaturas de candidatos (Unsplash y Wikimedia) y arma hojas de contacto por categoría."""
import json, os, sys, time, urllib.parse, urllib.request
from concurrent.futures import ThreadPoolExecutor
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, "cands")
UA = {"User-Agent": "UGOAL-app/0.1 (personal project)"}
src = json.load(open(os.path.join(ROOT, "catalog-src.json"), encoding="utf-8"))

def get(url, tries=4):
    for a in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
                return r.read()
        except Exception as e:
            if a == tries - 1: raise
            time.sleep(6 * (a + 1))

cands = {}  # "cat/id" -> list of {kind, ref, thumb, title, license}
for line in open(os.path.join(ROOT, "unsplash-cands.txt"), encoding="utf-8").read().strip().split(";"):
    k, v = line.split("=")
    cands[k] = [{"kind": "unsplash", "ref": "photo-" + x} for x in v.split(",") if x]

def commons(q):
    url = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode({
        "action": "query", "format": "json", "generator": "search", "gsrsearch": q + " filetype:bitmap",
        "gsrnamespace": 6, "gsrlimit": 12, "prop": "imageinfo", "iiprop": "url|size|mime|extmetadata",
        "iiurlwidth": 1200, "iiextmetadatafilter": "LicenseShortName|Artist"})
    d = json.loads(get(url))
    pages = sorted(d.get("query", {}).get("pages", {}).values(), key=lambda p: p.get("index", 99))
    res = []
    for p in pages:
        ii = p["imageinfo"][0]
        if ii.get("mime") != "image/jpeg" or ii.get("width", 0) < 1200 or ii["width"] < ii["height"]:
            continue
        res.append({"kind": "commons", "ref": p["title"][5:], "thumb": ii["thumburl"],
                    "license": ii.get("extmetadata", {}).get("LicenseShortName", {}).get("value", "")})
    return res[:6]

for cat in ("autos", "tech"):
    for id_, name, brand, q in src[cat]:
        k = f"{cat}/{id_}"
        if k in cands: continue
        try: cands[k] = commons(q)
        except Exception as e: cands[k] = []; print("ERR", k, e)
        time.sleep(1.5)
json.dump(cands, open(os.path.join(ROOT, "cands.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)

def thumb(job):
    k, i, c = job
    d = os.path.join(OUT, k.split("/")[0]); os.makedirs(d, exist_ok=True)
    f = os.path.join(d, f"{k.split('/')[1]}__{i}.jpg")
    if os.path.exists(f): return
    url = f"https://images.unsplash.com/{c['ref']}?w=360&q=70&fm=jpg" if c["kind"] == "unsplash" else c["thumb"]
    try:
        data = get(url)
        open(f, "wb").write(data)
        if c["kind"] == "commons":
            im = Image.open(f).convert("RGB"); im.thumbnail((360, 360)); im.save(f, "JPEG", quality=75)
    except Exception as e:
        print("ERR thumb", k, i, e)

jobs = [(k, i, c) for k, lst in cands.items() for i, c in enumerate(lst[:5])]
with ThreadPoolExecutor(6) as ex: list(ex.map(thumb, jobs))

# hojas de contacto: una fila por idea, hasta 5 candidatos
for cat in src:
    rows = [(id_, name) for id_, name, *_ in src[cat]]
    tw, th, lw = 150, 100, 170
    sheet = Image.new("RGB", (lw + 5 * tw, len(rows) * (th + 4)), "white"); dr = ImageDraw.Draw(sheet)
    for r, (id_, name) in enumerate(rows):
        y = r * (th + 4); dr.text((4, y + 40), f"{id_}", fill="black")
        for i in range(5):
            f = os.path.join(OUT, cat, f"{id_}__{i}.jpg")
            if os.path.exists(f):
                im = Image.open(f); im.thumbnail((tw - 4, th - 4)); sheet.paste(im, (lw + i * tw, y))
                dr.text((lw + i * tw + 2, y + 2), str(i), fill="yellow")
    sheet.save(os.path.join(ROOT, f"sheet-{cat}.jpg"), quality=70)
print("done", sum(len(v) for v in cands.values()))

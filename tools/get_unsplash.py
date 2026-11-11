"""Descarga las fotos elegidas a mano de Unsplash (tools/unsplash-picks.txt) y las encuadra 3:4 en app/public/catalog."""
import io, json, os, site, sys, time, urllib.request
sys.path.append(site.getusersitepackages())
from PIL import Image
from concurrent.futures import ThreadPoolExecutor
ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, '..', 'app', 'public', 'catalog')
MAP = os.path.join(ROOT, '..', 'app', 'src', 'data', 'photos.json')
CRED = os.path.join(OUT, 'creditos.json')
picks = dict(p.split('=') for p in open(os.path.join(ROOT, 'unsplash-picks.txt')).read().strip().split(';') if '=' in p)
photos = json.load(open(MAP, encoding='utf8')); cred = json.load(open(CRED, encoding='utf8'))
done = [0]; fail = []
def work(kv):
    iid, pid = kv
    url = f'https://images.unsplash.com/photo-{pid}?w=900&q=80&fm=jpg'
    for k in range(3):
        try:
            im = Image.open(io.BytesIO(urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'UGOAL-catalog/1.0'}), timeout=40).read())).convert('RGB')
            w, h = im.size; tw = min(w, int(h * 3 / 4)); th = min(h, int(w * 4 / 3))
            im = im.crop(((w - tw) // 2, (h - th) // 2, (w - tw) // 2 + tw, (h - th) // 2 + th)); im.thumbnail((800, 1066), Image.LANCZOS)
            im.save(os.path.join(OUT, iid + '.webp'), 'WEBP', quality=78, method=4)
            photos[iid] = {'img': iid + '.webp', 'mode': 'full'}
            cred[iid] = {'source': 'Unsplash', 'license': 'Unsplash License', 'link': f'https://unsplash.com/photos/{pid}'}
            done[0] += 1
            if done[0] % 25 == 0: print(f'llevo {done[0]} de {len(picks)} · faltan {len(picks) - done[0]}', flush=True)
            return
        except Exception as e:
            time.sleep(2)
    fail.append(iid)
with ThreadPoolExecutor(6) as ex: list(ex.map(work, picks.items()))
json.dump(photos, open(MAP, 'w', encoding='utf8'), ensure_ascii=False, indent=0)
json.dump(cred, open(CRED, 'w', encoding='utf8'), ensure_ascii=False, indent=1)
print('listo', done[0], 'de', len(picks), '· fallaron', fail)

"""Descarga íconos 3D de Microsoft Fluent Emoji (licencia MIT) y los guarda como WebP 160px en public/3d."""
import io, sys, time, urllib.parse, urllib.request, site
sys.path.append(site.getusersitepackages())
from PIL import Image
OUT = r'C:/Users/proba/OneDrive/Desktop/UGOAL/app/public/3d/'
BASE = 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/'
ICONS = {
  # categorías
  'autos': 'Automobile', 'moda': 'Running shoe', 'tech': 'Mobile phone', 'viajes': 'Airplane', 'casa': 'House with garden',
  'fisico': 'Flexed biceps', 'finanzas': 'Money bag', 'estudios': 'Books', 'escuela': 'Graduation cap', 'negocio': 'Convenience store',
  'eventos': 'Party popper', 'deudas': 'Credit card', 'salud': 'Sparkling heart', 'vicios': 'Prohibited',
  # vicios
  'cigarro': 'Cigarette', 'vape': 'Dashing away', 'alcohol': 'Wine glass', 'refresco': 'Cup with straw', 'azucar': 'Candy',
  'apuestas': 'Game die', 'redes': 'Mobile phone with arrow', 'chatarra': 'Hamburger', 'videojuegos': 'Video game', 'cafe': 'Hot beverage',
  'compras': 'Shopping bags', 'unas': 'Nail polish', 'otro': 'Cross mark',
  # insignias y extras
  'trophy': 'Trophy', 'fire': 'Fire', 'star': 'Glowing star', 'gem': 'Gem stone', 'crown': 'Crown', 'rocket': 'Rocket',
  'medal': 'Sports medal', 'seedling': 'Seedling', 'hundred': 'Hundred points', 'bell': 'Bell', 'target': 'Direct hit',
  'piggy': 'Money with wings', 'handshake': 'Handshake', 'calendar': 'Spiral calendar', 'chart': 'Chart increasing', 'shield': 'Shield',
  'couple': 'Two hearts', 'motorcycle': 'Motorcycle', 'laptop': 'Laptop', 'game': 'Joystick', 'headphone': 'Headphone', 'watch': 'Watch',
  'tv': 'Television', 'camera': 'Camera', 'tshirt': 'T-shirt', 'ring': 'Ring', 'handbag': 'Handbag', 'beach': 'Beach with umbrella',
  'tooth': 'Tooth', 'glasses': 'Glasses', 'muscle': 'Flexed biceps', 'running': 'Person running', 'bed': 'Bed', 'couch': 'Couch and lamp',
  'fork': 'Fork and knife with plate', 'key': 'Key', 'ticket': 'Admission tickets', 'brain': 'Brain', 'lock': 'Locked', 'envelope': 'Love letter',
  'swim': 'Person swimming', 'snow': 'Snow-capped mountain', 'zzz': 'Zzz', 'droplet': 'Droplet', 'yoga': 'Person in lotus position',
  'world': 'Globe showing Americas', 'mx': 'Taco', 'castle': 'Castle', 'statue': 'Statue of Liberty', 'temple': 'Shinto shrine', 'mountain': 'Mountain',
  'city': 'Cityscape', 'island': 'Desert island', 'building': 'Office building', 'kitchen': 'Cooking', 'washing': 'Basket', 'bath': 'Bathtub',
  'plant': 'Potted plant', 'snowflake': 'Snowflake', 'broom': 'Broom', 'box': 'Package', 'heart': 'Red heart', 'pill': 'Pill', 'lipstick': 'Lipstick',
  'bank': 'Bank', 'chartup': 'Chart increasing with yen', 'umbrella': 'Umbrella', 'memo': 'Memo', 'language': 'Speech balloon', 'music': 'Guitar',
  'palette': 'Artist palette', 'wrench': 'Wrench', 'scissors': 'Scissors', 'truck': 'Delivery truck', 'wedding': 'Wedding', 'cake': 'Birthday cake',
  'baby': 'Baby bottle', 'gift': 'Wrapped gift', 'christmas': 'Christmas tree', 'school': 'School', 'backpack': 'Backpack', 'pencil': 'Pencil',
}
def get(url):
  req = urllib.request.Request(url, headers={'User-Agent': 'ugoal-build'})
  return urllib.request.urlopen(req, timeout=30).read()
miss = []
for key, name in ICONS.items():
  slug = name.lower().replace(' ', '_').replace('-', '_')
  cands = [f'{name}/3D/{slug}_3d.png', f'{name}/Default/3D/{slug}_3d_default.png']
  data = None
  for c in cands:
    try: data = get(BASE + urllib.parse.quote(c)); break
    except Exception: pass
  if not data: miss.append(key + ':' + name); continue
  im = Image.open(io.BytesIO(data)).convert('RGBA'); im.thumbnail((160, 160))
  im.save(OUT + key + '.webp', 'WEBP', quality=88)
  time.sleep(0.05)
print('faltan', miss)

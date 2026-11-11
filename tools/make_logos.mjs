// Genera app/src/data/logos.json: marca del catálogo → { path, hex, title } a partir de Simple Icons (CC0).
// Uso: node tools/make_logos.mjs   (desde la carpeta UGOAL)
import fs from 'node:fs'
import * as si from '../app/node_modules/simple-icons/index.mjs'

const all = Object.values(si).filter(x => x && x.path)
const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '')
const by = new Map(all.map(i => [norm(i.title), i]))
const ALIAS = {
  'Chirey': 'Chery', 'Dodge y RAM': 'Dodge', 'Mercedes-Benz': 'Mercedes', 'GWM': 'Great Wall Motors', 'BMW Motorrad': 'BMW',
  'Asics y Onitsuka': 'Asics', 'On y Hoka': 'Hoka', 'Seiko y Citizen': 'Seiko', 'Swatch y Tissot': 'Swatch', 'TAG Heuer y Omega': 'TAG Heuer',
  'Nike y Adidas': 'Nike', 'Ralph Lauren y Lacoste': 'Lacoste', "Stone Island y Arc'teryx": "Arc'teryx", "Carhartt y Levi's": "Levi's",
  'JBL y Marshall': 'JBL', 'Beats y Sonos': 'Beats', 'Xiaomi y Huawei': 'Xiaomi', 'TCL y Hisense': 'TCL', 'GoPro e Insta360': 'GoPro',
  'Acer y MSI': 'Acer', 'Xiaomi y Lenovo': 'Xiaomi', 'Bajaj y TVS': 'Bajaj', 'Cadillac y Lincoln': 'Cadillac', 'Omoda y Jaecoo': 'Omoda',
  'Amazon y Google': 'Amazon', 'PlayStation': 'PlayStation', 'Xbox': 'Xbox', 'Harley-Davidson': 'Harley-Davidson', 'The North Face': 'The North Face',
  'Volkswagen Comerciales': 'Volkswagen', 'New Era': 'New Era', 'Rolex': 'Rolex', 'Land Rover': 'Land Rover', 'Alfa Romeo': 'Alfa Romeo',
}
const groups = new Set()
for (const f of ['autos', 'tech', 'moda']) {
  const t = fs.readFileSync(new URL(`../app/src/data/cat/${f}.ts`, import.meta.url), 'utf8')
  for (const l of t.split(/\r?\n/)) if (l.startsWith('@')) { const g = l.slice(1).trim(); groups.add(g); if (/ y | e /.test(g)) g.split(/ y | e /).forEach(x => groups.add(x)) }
}
const out = {}, miss = []
for (const g of groups) {
  const want = ALIAS[g] ?? g
  const i = by.get(norm(want)) ?? all.find(x => norm(x.title).startsWith(norm(want)) && norm(want).length > 2)
  if (i) out[g] = { path: i.path, hex: '#' + i.hex, title: i.title }
  else miss.push(g)
}
fs.writeFileSync(new URL('../app/src/data/logos.json', import.meta.url), JSON.stringify(out))
console.log(Object.keys(out).length, 'con logo; sin logo:', miss.join(', '))

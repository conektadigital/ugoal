// Genera dist/ugoal.html: la misma app compilada, empaquetada para la vista previa privada en claude.ai.
import { readFileSync, writeFileSync } from 'node:fs'

const html = readFileSync('dist/index.html', 'utf8')
const js = html.match(/<script type="module" crossorigin src="\.\/(assets\/[^"]+\.js)"/)?.[1]
const css = html.match(/<link rel="stylesheet" crossorigin href="\.\/(assets\/[^"]+\.css)"/)?.[1]
if (!js) throw new Error('No encontré el script compilado en dist/index.html')
const page = `<title>UGOAL</title>
<meta name="claude:viewport-fit-sides" content="cover">
${css ? `<link rel="stylesheet" href="${css}">` : ''}
<style>:root{--safe-top:0px}</style>
<div id="root"></div>
<script type="module" src="${js}"></script>
`
writeFileSync('dist/ugoal.html', page)
console.log('dist/ugoal.html listo ->', js, css ?? '(sin css)')

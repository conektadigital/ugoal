/* Tono: coach directo. Frases cortas, en segunda persona, sin rodeos. */
export const DAILY = [
  'Nadie lo va a hacer por ti. Aparta hoy.',
  'Lo que quieres cuesta lo mismo hoy que mañana. Empieza hoy.',
  'Disciplina es elegir lo que quieres más sobre lo que quieres ahora.',
  'Cada peso que apartas es un voto por la persona que quieres ser.',
  'No necesitas motivación. Necesitas el hábito.',
  'Tu yo del futuro ya te está viendo. No le falles.',
  'Poco, pero cada quincena. Así se llega.',
  'El antojo dura cinco minutos. La meta te dura años.',
  'Si fuera fácil, todos lo tendrían. Tú vas a tenerlo.',
  'No cuentes los días. Haz que cada día cuente.',
  'Hoy apartas. Mañana manejas, viajas, estrenas.',
  'Constancia le gana a talento. Todos los días.',
  'Deja de esperar el momento perfecto. Ese momento es hoy.',
  'Tu meta no se mueve. Tú sí.',
  'Lo difícil no es empezar. Es no soltarlo. No lo sueltes.',
  'Ganarle al gasto hormiga también es ganar.',
  'Primero págate a ti. Después a todo lo demás.',
  'Un mal mes no cancela un buen año. Sigue.',
  'Las metas grandes se pagan en pedazos chicos.',
  'Hazlo cansado, hazlo sin ganas, pero hazlo.',
  'Nadie se arrepiente de haber ahorrado.',
  'Tu cartera sigue a tus prioridades. Revisa las tuyas.',
  'Más cerca que ayer. Más lejos que mañana si te detienes.',
  'El que aparta primero, compra sin deber.',
  'Los resultados llegan tarde. La disciplina llega primero.',
  'Cierra la app de compras. Abre UGOAL.',
  'No es suerte. Es repetición.',
  'Tu sueño tiene precio y fecha. Ahora tiene plan.',
  'Gánale a tu excusa favorita.',
  'Un paso hoy. Otro mañana. Así se cruza la meta.',
]
export const AFTER_SAVE = [
  'Eso es. Un paso más cerca.',
  'Así se hace. Sigue igual.',
  'Bien. Tu yo del futuro te lo agradece.',
  'Hecho. La constancia está de tu lado.',
  'Otro ladrillo puesto. Sigue construyendo.',
  'Disciplina pura. Así se llega.',
  'Ese peso ya trabaja para ti.',
  'Vas en serio. Se nota.',
  'Menos falta. No aflojes.',
  'Quincena ganada.',
  'Así, sin drama. Solo resultados.',
  'Cumpliste. Ahora repite.',
]
export const BEHIND = [
  'Vas atrás. No es momento de excusas, es momento de apartar.',
  'Te estás quedando. Recupéralo esta quincena.',
  'La meta no espera. Ponte al día hoy.',
  'Atrasarse pasa. Quedarse atrás es decisión.',
  'Un empujón hoy y vuelves al ritmo.',
  'No negocies con tu meta. Ponte al corriente.',
]
export const AFTER_WORKOUT = [
  'Entrenamiento hecho. Eso es carácter.',
  'Cuerpo en movimiento, meta en camino.',
  'Una sesión más. Así se cambia.',
  'Sudor de hoy, resultado de mañana.',
]
export const RELAPSE = [
  'Un tropiezo no borra el camino. Día uno, otra vez.',
  'Caer es parte. Quedarte en el piso no.',
  'Lo que ya aguantaste sigue contando. Vuelve hoy.',
  'Nadie lo deja a la primera. Lo importante es volver.',
]
export const pick = (arr: string[], seed?: number) => arr[(seed ?? Math.floor(Math.random() * 1e6)) % arr.length]
export const dailySeed = () => { const d = new Date(); return d.getFullYear() * 400 + d.getMonth() * 31 + d.getDate() }

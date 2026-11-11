import type { Session } from '../types'

export interface PlanDef { kind: 'plan'; weeks: number; unit: string; base: number; target: number; label: string; make: (w: number, n: number) => string[] }
export interface HabitDef { kind: 'habito'; days: number; label: string }

const lerp = (a: number, b: number, w: number, n: number) => Math.round((a + (b - a) * (w / Math.max(1, n - 1))) * 2) / 2

const run = (weeks: number, base: number, target: number): PlanDef => ({
  kind: 'plan', weeks, unit: 'km', base, target, label: 'Tu distancia más larga',
  make: (w, n) => [
    `Trote suave ${Math.round(lerp(20, 45, w, n))} min`,
    w % 2 ? `Intervalos ${Math.round(lerp(5, 10, w, n))} × 400 m` : `Cuestas ${Math.round(lerp(4, 8, w, n))} × 30 s`,
    w === n - 1 ? `Día de prueba: ${target} km` : `Carrera larga ${lerp(base, target * 0.9, w, n)} km`,
  ],
})
const reps = (weeks: number, unit: string, base: number, target: number, label: string, moves: [string, string]): PlanDef => ({
  kind: 'plan', weeks, unit, base, target, label,
  make: (w, n) => [
    `${moves[0]}: ${Math.round(lerp(3, 6, w, n))} series`,
    `${moves[1]}: ${Math.round(lerp(3, 5, w, n))} series`,
    `Prueba de máximo (meta: ${Math.round(lerp(base, target, w, n))} ${unit})`,
  ],
})

export const PLANS: Record<string, PlanDef | HabitDef> = {
  '5k': run(8, 1, 5),
  '10k': run(10, 3, 10),
  medio: run(12, 8, 21.1),
  maraton: run(16, 15, 42.2),
  bajar5: { kind: 'plan', weeks: 10, unit: 'kg bajados', base: 0, target: 5, label: 'Kilos bajados', make: (w, n) => ['Fuerza cuerpo completo 40 min', `Caminata rápida ${Math.round(lerp(30, 60, w, n))} min`, 'Fuerza + 15 min de cardio'] },
  bajar10: { kind: 'plan', weeks: 20, unit: 'kg bajados', base: 0, target: 10, label: 'Kilos bajados', make: (w, n) => ['Fuerza tren inferior', `Cardio ${Math.round(lerp(25, 50, w, n))} min`, 'Fuerza tren superior', 'Caminata larga 60 min'] },
  musculo: { kind: 'plan', weeks: 12, unit: 'kg en sentadilla', base: 40, target: 80, label: 'Tu sentadilla', make: () => ['Empuje: pecho, hombro, tríceps', 'Jalón: espalda y bíceps', 'Pierna completa', 'Torso y core'] },
  dominadas: reps(8, 'reps', 3, 20, 'Dominadas seguidas', ['Negativas lentas', 'Remo australiano']),
  lagartijas: reps(6, 'reps', 15, 50, 'Lagartijas seguidas', ['Lagartijas inclinadas', 'Plancha alta']),
  plancha: { kind: 'plan', weeks: 6, unit: 's', base: 45, target: 180, label: 'Tu mejor plancha', make: (w, n) => [`Plancha ${Math.round(lerp(4, 6, w, n))} × ${Math.round(lerp(30, 90, w, n))} s`, 'Core: dead bug y hollow', `Prueba de máximo`] },
  nadar: { kind: 'plan', weeks: 10, unit: 'm', base: 200, target: 1000, label: 'Tu nado continuo', make: (w, n) => ['Técnica 30 min', `Series ${Math.round(lerp(6, 12, w, n))} × 50 m`, `Nado continuo ${Math.round(lerp(200, 1000, w, n) / 50) * 50} m`] },
  bici: { kind: 'plan', weeks: 8, unit: 'km', base: 15, target: 50, label: 'Tu rodada más larga', make: (w, n) => ['Rodada suave 45 min', 'Intervalos en subida', `Rodada larga ${Math.round(lerp(15, 50, w, n))} km`] },
  triatlon: { kind: 'plan', weeks: 12, unit: 'sesiones', base: 0, target: 36, label: 'Sesiones completadas', make: () => ['Natación 30 min', 'Bici 45 min', 'Carrera 30 min'] },
  box: { kind: 'plan', weeks: 8, unit: 'sesiones', base: 0, target: 24, label: 'Sesiones completadas', make: () => ['Técnica y sombra', 'Costal 6 rounds', 'Condición y cuerda'] },
  calistenia: reps(10, 'reps', 0, 10, 'Muscle-ups o progresión', ['Dominadas', 'Fondos en paralelas']),
  nevado: { kind: 'plan', weeks: 8, unit: 'km', base: 5, target: 14, label: 'Tu caminata más larga', make: (w, n) => ['Escaleras 30 min', 'Fuerza de pierna', `Caminata con desnivel ${Math.round(lerp(5, 14, w, n))} km`] },
  gym4: { kind: 'plan', weeks: 12, unit: 'sesiones', base: 0, target: 48, label: 'Sesiones de gym', make: () => ['Empuje: pecho, hombro, tríceps', 'Pierna completa', 'Jalón: espalda y bíceps', 'Cuerpo completo + cardio 15 min'] },
  flexibilidad: { kind: 'plan', weeks: 8, unit: 'cm del piso', base: 15, target: 0, label: 'Distancia de tus dedos al piso', make: (w, n) => [`Isquiotibiales ${Math.round(lerp(8, 15, w, n))} min`, 'Cadera y espalda baja 10 min', 'Prueba: agáchate con piernas rectas y mide'] },
  obstaculos: { kind: 'plan', weeks: 10, unit: 'km', base: 2, target: 5, label: 'Tu distancia con obstáculos', make: (w, n) => [`Trote ${Math.round(lerp(20, 40, w, n))} min`, 'Fuerza de agarre: colgarte y dominadas', `Circuito: burpees, cargas y ${lerp(2, 5, w, n)} km`] },
  grasa: { kind: 'plan', weeks: 16, unit: '% grasa', base: 25, target: 15, label: 'Tu % de grasa', make: () => ['Fuerza tren inferior', 'Cardio 30 min', 'Fuerza tren superior', 'Caminata de 10,000 pasos'] },
  sentadillas: { kind: 'habito', days: 30, label: 'Días con 100 sentadillas' },
  yoga: { kind: 'habito', days: 30, label: 'Días con yoga' },
  dormir: { kind: 'habito', days: 30, label: 'Noches de 8 horas' },
  agua: { kind: 'habito', days: 30, label: 'Días con 2 L de agua' },
  pasos: { kind: 'habito', days: 30, label: 'Días con 10,000 pasos' },
}

export function buildWeeks(def: PlanDef): Session[][] {
  return Array.from({ length: def.weeks }, (_, w) => def.make(w, def.weeks).map(t => ({ t, done: false })))
}

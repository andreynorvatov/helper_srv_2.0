import type { UzCalcResult, UzStep, UzStepType } from '../types'

export const DEFAULT_REGISTRY = 8000000

export const STORAGE_KEY = 'uz-calculator'

export function createDefaultSteps(): UzStep[] {
  return [{ id: 0, type: 'ramp', min: 15, start: 0, stop: 100, uzPerPeriod: 0, uzCumulative: 0, uzRemaining: 0, time: 0 }]
}

export function calculate(steps: UzStep[], registry: number): UzCalcResult {
  let cumUZ = 0
  let cumTime = 0

  steps.forEach((s) => {
    const avg = (s.start + s.stop) / 2
    s.uzPerPeriod = avg * s.min * 60
    cumUZ += s.uzPerPeriod
    s.uzCumulative = cumUZ
    s.uzRemaining = registry - cumUZ
    cumTime += s.min
    s.time = cumTime
  })

  return { registry, totalUZ: cumUZ, totalTime: cumTime }
}

export function fmt(n: number | undefined | null): string {
  if (n === undefined || n === null || Number.isNaN(n)) return '0'
  return Number(n).toLocaleString('ru-RU')
}

export function fmtPct(n: number): string {
  return Number(n).toFixed(1) + '%'
}

export function fmtHours(minutes: number | undefined | null): string {
  if (minutes === undefined || minutes === null || Number.isNaN(minutes)) return '0ч 0мин'
  const h = Math.floor(minutes / 60)
  const m = Math.floor(minutes % 60)
  if (h === 0) return m + 'мин'
  if (m === 0) return h + 'ч'
  return h + 'ч ' + m + 'мин'
}

export function calcTenth(cumUZ: number, registry: number): string {
  if (registry <= 0) return '—'
  const tenth = Math.ceil(cumUZ / (registry / 10))
  if (tenth <= 0) return '0/10'
  if (tenth >= 10) return '10/10'
  return tenth + '/10'
}

export function addStep(steps: UzStep[], nextId: number, selectedStepId: number | null): { steps: UzStep[]; nextId: number; selectedStepId: number } {
  let insertIdx = steps.length
  let refStep: UzStep | null = steps.length > 0 ? steps[steps.length - 1] : null

  if (selectedStepId !== null) {
    const selIdx = steps.findIndex((s) => s.id === selectedStepId)
    if (selIdx !== -1) {
      insertIdx = selIdx + 1
      refStep = steps[selIdx]
    }
  }

  const newStep: UzStep = {
    id: nextId,
    type: 'ramp',
    min: 5,
    start: refStep ? refStep.stop : 0,
    stop: refStep ? refStep.stop + 100 : 400,
    uzPerPeriod: 0,
    uzCumulative: 0,
    uzRemaining: 0,
    time: 0,
  }

  const updated = [...steps]
  updated.splice(insertIdx, 0, newStep)

  return { steps: updated, nextId: nextId + 1, selectedStepId: newStep.id }
}

export function removeStep(
  steps: UzStep[],
  id: number,
  selectedStepId: number | null,
): { steps: UzStep[]; selectedStepId: number | null } {
  if (steps.length <= 1) return { steps, selectedStepId }
  const updated = steps.filter((s) => s.id !== id)
  return { steps: updated, selectedStepId: selectedStepId === id ? null : selectedStepId }
}

export function updateStepField(steps: UzStep[], id: number, field: 'min' | 'start' | 'stop', value: number): UzStep[] {
  return steps.map((s) => {
    if (s.id !== id) return s
    const next = { ...s, [field]: value }
    // Стабильная нагрузка: stop = start
    if (field === 'start' && next.type === 'stable') {
      next.stop = value
    }
    return next
  })
}

export function updateStepType(steps: UzStep[], id: number, type: UzStepType): UzStep[] {
  return steps.map((s) => {
    if (s.id !== id) return s
    const next = { ...s, type }
    // При переходе на стабильную — stop = start
    if (type === 'stable') {
      next.stop = next.start
    }
    return next
  })
}

export function distributeRemainderToLastStep(steps: UzStep[], registry: number): UzStep[] {
  if (steps.length === 0) return steps
  const { totalUZ } = calculate(steps, registry)
  const remainder = registry - totalUZ
  if (Math.abs(remainder) < 1) return steps

  const lastStep = steps[steps.length - 1]
  const rate = lastStep.type === 'stable' ? lastStep.start : (lastStep.start + lastStep.stop) / 2

  const updated = [...steps]

  if (rate > 0) {
    const deltaMin = remainder / (rate * 60)
    updated[updated.length - 1] = { ...lastStep, min: Math.max(1, Math.round(lastStep.min + deltaMin)) }
  } else {
    const lastUZ = lastStep.uzPerPeriod
    const newUZ = Math.max(0, lastUZ + remainder)
    const min = Math.max(lastStep.min, 1)
    if (lastStep.type === 'stable') {
      updated[updated.length - 1] = { ...lastStep, start: newUZ / (min * 60), stop: newUZ / (min * 60) }
    } else {
      updated[updated.length - 1] = { ...lastStep, stop: Math.max(0, (2 * newUZ) / (min * 60) - lastStep.start) }
    }
  }

  return updated
}

export function distributeAllTo1000(registry: number, nextId: number): UzStep[] {
  const rampUZ = ((0 + 1000) / 2) * 15 * 60 // 450,000
  const remaining = Math.max(0, registry - rampUZ)
  const stableMin = Math.floor(remaining / (1000 * 60))

  return [
    { id: nextId, type: 'ramp', min: 15, start: 0, stop: 1000, uzPerPeriod: 0, uzCumulative: 0, uzRemaining: 0, time: 0 },
    { id: nextId + 1, type: 'stable', min: stableMin, start: 1000, stop: 1000, uzPerPeriod: 0, uzCumulative: 0, uzRemaining: 0, time: 0 },
  ]
}

export function loadPersistedState(): { registry: number; steps: UzStep[]; nextId: number } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { registry: number; steps: UzStep[]; nextId: number }
    if (!Array.isArray(parsed.steps) || parsed.steps.length === 0) return null
    return parsed
  } catch {
    return null
  }
}

export function savePersistedState(registry: number, steps: UzStep[], nextId: number) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ registry, steps, nextId }))
  } catch {
    // localStorage недоступен — игнорируем
  }
}

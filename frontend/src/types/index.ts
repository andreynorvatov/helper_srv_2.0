export type TabId = 'balance' | 'profile' | 'docs'

export interface Balance {
  credits: number
  limit: number
  usage: number
}

export type UzStepType = 'ramp' | 'stable'

export interface UzStep {
  id: number
  type: UzStepType
  min: number
  start: number
  stop: number
  /** УЗ за период (расчётное) */
  uzPerPeriod: number
  /** УЗ нарастающим итогом (расчётное) */
  uzCumulative: number
  /** УЗ остаток до реестра (расчётное) */
  uzRemaining: number
  /** Время нарастающим итогом, мин (расчётное) */
  time: number
}

export interface UzCalcResult {
  registry: number
  totalUZ: number
  totalTime: number
}

export interface UzPersistedState {
  registry: number
  steps: UzStep[]
  nextId: number
}

export type TabId = 'balance' | 'profile' | 'docs'

export interface Balance {
  /** Остаток на балансе (limit - usage); null — безлимитный ключ */
  credits: number | null
  /** Лимит ключа (0 — без лимита) */
  limit: number
  /** Потрачено всего */
  usage: number
  /** Потрачено за сегодня */
  usage_daily: number
  /** Потрачено за неделю */
  usage_weekly: number
  /** Потрачено за месяц */
  usage_monthly: number
  /** Метка ключа (label из OpenRouter) */
  label?: string | null
  /** Бесплатный тариф */
  is_free_tier: boolean
  /** Баланс аккаунта: всего куплено кредитов (из /credits) */
  total_credits: number
  /** Баланс аккаунта: потрачено всего (из /credits) */
  total_usage: number
  /** Баланс аккаунта: остаток (total_credits - total_usage) */
  remaining_credits: number
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

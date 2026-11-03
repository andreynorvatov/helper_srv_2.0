import { useEffect, useMemo, useRef, useState } from 'react'
import type { UzStep, UzStepType } from '../../types'
import Card from '../ui/Card'
import Button from '../ui/Button'
import UzTable from '../uz/UzTable'
import UzChart from '../uz/UzChart'
import { useTheme } from '../../hooks/useTheme'
import {
  DEFAULT_REGISTRY,
  addStep,
  calculate,
  createDefaultSteps,
  distributeAllTo1000,
  distributeRemainderToLastStep,
  fmt,
  fmtHours,
  fmtPct,
  loadPersistedState,
  removeStep,
  savePersistedState,
  updateStepField,
  updateStepType,
} from '../../utils/uzCalculator'

export default function ProfileTab() {
  const { resolvedTheme } = useTheme()

  const [registry, setRegistry] = useState<number>(() => {
    const persisted = loadPersistedState()
    return persisted ? persisted.registry : DEFAULT_REGISTRY
  })
  const [steps, setSteps] = useState<UzStep[]>(() => {
    const persisted = loadPersistedState()
    return persisted ? persisted.steps : createDefaultSteps()
  })
  const [nextId, setNextId] = useState<number>(() => {
    const persisted = loadPersistedState()
    return persisted ? persisted.nextId : 1
  })
  const [selectedStepId, setSelectedStepId] = useState<number | null>(null)

  // Сохранение в localStorage
  useEffect(() => {
    savePersistedState(registry, steps, nextId)
  }, [registry, steps, nextId])

  // Расчётные значения (копия шагов, чтобы не мутировать state)
  const computed = useMemo(() => {
    const copy = steps.map((s) => ({ ...s }))
    const result = calculate(copy, registry)
    return { steps: copy, ...result }
  }, [steps, registry])

  const coveragePct = registry > 0 ? (computed.totalUZ / registry) * 100 : 0
  const remainUZ = registry - computed.totalUZ

  function handleFieldChange(id: number, field: 'min' | 'start' | 'stop', value: number) {
    setSteps((prev) => updateStepField(prev, id, field, value))
  }

  function handleTypeChange(id: number, type: UzStepType) {
    setSteps((prev) => updateStepType(prev, id, type))
  }

  function handleAddStep() {
    const result = addStep(steps, nextId, selectedStepId)
    setSteps(result.steps)
    setNextId(result.nextId)
    setSelectedStepId(result.selectedStepId)
  }

  function handleRemoveStep(id: number) {
    const result = removeStep(steps, id, selectedStepId)
    setSteps(result.steps)
    setSelectedStepId(result.selectedStepId)
  }

  function handleDistributeRemainder() {
    setSteps((prev) => distributeRemainderToLastStep(prev, registry))
  }

  function handleDistributeAll() {
    const newSteps = distributeAllTo1000(registry, nextId)
    setSteps(newSteps)
    setNextId(nextId + 2)
    setSelectedStepId(null)
  }

  function handleReset() {
    setRegistry(DEFAULT_REGISTRY)
    setSteps(createDefaultSteps())
    setNextId(1)
    setSelectedStepId(null)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'INPUT') {
      handleAddStep()
    }
  }

  return (
    <div className="flex flex-col gap-6" onKeyDown={handleKeyDown}>
      {/* Реестр УЗ */}
      <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-surface p-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Реестр УЗ</h2>
          <p className="text-xs text-muted">Целевой объём нагрузки для расчёта покрытия</p>
        </div>
        <RegistryInput value={registry} onChange={setRegistry} />
      </div>

      {/* Таблица шагов */}
      <Card title="Шаги нагрузки">
        <UzTable
          steps={computed.steps}
          selectedStepId={selectedStepId}
          onSelect={setSelectedStepId}
          onFieldChange={handleFieldChange}
          onTypeChange={handleTypeChange}
          onRemove={handleRemoveStep}
        />

        <div className="mt-4 flex flex-wrap gap-2.5">
          <Button onClick={handleAddStep} className="flex-1">＋ Добавить шаг</Button>
          <Button
            onClick={handleDistributeRemainder}
            className="flex-1 bg-background text-foreground border border-border"
          >
            🎯 Распределить остаток УЗ на последний шаг
          </Button>
          <Button
            onClick={handleDistributeAll}
            className="flex-1 bg-background text-foreground border border-border"
          >
            📤 Распределить все на 1000
          </Button>
          <Button
            onClick={handleReset}
            className="flex-1 bg-background text-foreground border border-border"
          >
            ↺ Сбросить
          </Button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          <SummaryItem label="Всего УЗ за период" value={fmt(computed.totalUZ)} />
          <SummaryItem
            label="Покрытие реестра"
            value={fmtPct(coveragePct)}
            tone={coveragePct > 100 ? 'danger' : 'success'}
          />
          <SummaryItem label="Общее время" value={fmtHours(computed.totalTime)} />
          <SummaryItem
            label="Остаток УЗ"
            value={fmt(remainUZ)}
            tone={remainUZ < 0 ? 'danger' : 'success'}
          />
        </div>
      </Card>

      {/* График */}
      <Card title="График нагрузки">
        <UzChart steps={computed.steps} registry={registry} resolvedTheme={resolvedTheme} />
      </Card>
    </div>
  )
}

function SummaryItem({ label, value, tone }: { label: string; value: string; tone?: 'danger' | 'success' }) {
  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <div className="text-xs font-medium text-muted">{label}</div>
      <div
        className="mt-1 text-xl font-bold text-foreground"
        style={tone ? { color: `var(--${tone})` } : undefined}
      >
        {value}
      </div>
    </div>
  )
}

const REGISTRY_PRESETS = [1000000, 2000000, 3000000, 5000000, 8000000]

function RegistryInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [text, setText] = useState(String(value))
  const focused = useRef(false)

  useEffect(() => {
    if (!focused.current) setText(String(value))
  }, [value])

  const isPreset = REGISTRY_PRESETS.includes(value)

  return (
    <div className="flex items-center gap-2">
      <select
        value={isPreset ? String(value) : ''}
        onChange={(e) => {
          if (e.target.value !== '') onChange(Number(e.target.value))
        }}
        className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary"
      >
        <option value="" disabled>
          Выбрать…
        </option>
        {REGISTRY_PRESETS.map((p) => (
          <option key={p} value={p}>
            {fmt(p)}
          </option>
        ))}
      </select>
      <input
        id="registryInput"
        type="text"
        inputMode="numeric"
        value={text}
        onFocus={() => (focused.current = true)}
        onBlur={() => {
          focused.current = false
          setText(String(value))
        }}
        onChange={(e) => {
          setText(e.target.value)
          const v = parseFloat(e.target.value)
          if (!Number.isNaN(v) && v >= 0) onChange(v)
        }}
        className="w-[140px] rounded-lg border border-border bg-background px-3 py-2 text-right text-base font-semibold outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary"
      />
    </div>
  )
}

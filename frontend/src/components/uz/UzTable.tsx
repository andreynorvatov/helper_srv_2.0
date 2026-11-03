import type { CSSProperties } from 'react'
import type { UzStep, UzStepType } from '../../types'
import { fmt, fmtHours } from '../../utils/uzCalculator'

interface UzTableProps {
  steps: UzStep[]
  selectedStepId: number | null
  onSelect: (id: number) => void
  onFieldChange: (id: number, field: 'min' | 'start' | 'stop', value: number) => void
  onTypeChange: (id: number, type: UzStepType) => void
  onRemove: (id: number) => void
}

const TYPE_LABELS: Record<UzStepType, string> = {
  ramp: 'Рампап',
  stable: 'Стабильная',
}

const TYPE_STYLE: Record<UzStepType, CSSProperties> = {
  ramp: { color: 'var(--step-ramp)', background: 'var(--step-ramp-bg)' },
  stable: { color: 'var(--step-stable)', background: 'var(--step-stable-bg)' },
}

const TH = 'bg-background px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-wide text-muted border-b border-border whitespace-nowrap'

export default function UzTable({ steps, selectedStepId, onSelect, onFieldChange, onTypeChange, onRemove }: UzTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className={`${TH} w-[30px] text-left`}>#</th>
            <th className={`${TH} min-w-[100px]`}>Тип шага</th>
            <th className={TH}>Мин</th>
            <th className={TH}>Старт</th>
            <th className={TH}>Стоп</th>
            <th className={`${TH} min-w-[90px]`}>УЗ за период</th>
            <th className={`${TH} min-w-[100px] hidden md:table-cell`}>УЗ нарастающим итогом</th>
            <th className={`${TH} min-w-[80px] hidden xl:table-cell`}>УЗ остаток</th>
            <th className={`${TH} min-w-[70px] hidden sm:table-cell`}>Время, мин</th>
            <th className={`${TH} min-w-[60px] hidden xl:table-cell`}>Время, ч</th>
            <th className={`${TH} w-[36px]`}></th>
          </tr>
        </thead>
        <tbody>
          {steps.map((s, idx) => {
            const selected = s.id === selectedStepId
            return (
              <tr
                key={s.id}
                onClick={(e) => {
                  const target = e.target as HTMLElement
                  if (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'BUTTON') return
                  onSelect(s.id)
                }}
                className={`cursor-pointer transition-colors hover:bg-background ${
                  selected ? 'bg-background' : ''
                }`}
              >
                <td className="px-2 py-2 text-left border-b border-border">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-border text-[11px] font-bold text-muted">
                    {idx + 1}
                  </span>
                </td>
                <td className="px-2 py-2 text-center border-b border-border">
                  <select
                    value={s.type}
                    onChange={(e) => onTypeChange(s.id, e.target.value as UzStepType)}
                    style={TYPE_STYLE[s.type]}
                    className="min-w-[110px] cursor-pointer rounded-lg border border-transparent px-2.5 py-1.5 text-[13px] font-medium outline-none transition-all"
                  >
                    <option value="ramp">{TYPE_LABELS.ramp}</option>
                    <option value="stable">{TYPE_LABELS.stable}</option>
                  </select>
                </td>
                <td className="px-2 py-2 text-center border-b border-border">
                  <CellInput value={s.min} onChange={(v) => onFieldChange(s.id, 'min', v)} />
                </td>
                <td className="px-2 py-2 text-center border-b border-border">
                  <CellInput value={s.start} onChange={(v) => onFieldChange(s.id, 'start', v)} />
                </td>
                <td className="px-2 py-2 text-center border-b border-border">
                  <CellInput value={s.stop} onChange={(v) => onFieldChange(s.id, 'stop', v)} />
                </td>
                <td className="px-2 py-2 text-center border-b border-border text-[13px] font-semibold text-foreground whitespace-nowrap">
                  {fmt(s.uzPerPeriod)}
                </td>
                <td className="px-2 py-2 text-center border-b border-border text-[13px] font-semibold whitespace-nowrap hidden md:table-cell" style={{ color: 'var(--chart-cum)' }}>
                  {fmt(s.uzCumulative)}
                </td>
                <td
                  className="px-2 py-2 text-center border-b border-border text-[13px] font-semibold whitespace-nowrap hidden xl:table-cell"
                  style={{ color: s.uzRemaining < 0 ? 'var(--danger)' : 'var(--success)' }}
                >
                  {fmt(s.uzRemaining)}
                </td>
                <td className="px-2 py-2 text-center border-b border-border text-[13px] font-semibold text-muted whitespace-nowrap hidden sm:table-cell">
                  {s.time}
                </td>
                <td className="px-2 py-2 text-center border-b border-border text-[13px] font-semibold text-muted whitespace-nowrap hidden xl:table-cell">
                  {fmtHours(s.time)}
                </td>
                <td className="px-2 py-2 text-center border-b border-border">
                  <button
                    type="button"
                    title="Удалить шаг"
                    onClick={() => onRemove(s.id)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-lg leading-none text-muted transition-colors hover:bg-background hover:text-danger"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function CellInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <input
      type="number"
      value={value}
      onChange={(e) => {
        const v = parseFloat(e.target.value)
        if (!Number.isNaN(v) && v >= 0) onChange(v)
      }}
      className="w-full min-w-[64px] max-w-[110px] rounded-lg border border-transparent bg-background px-2 py-1.5 text-center text-sm font-medium outline-none transition-all hover:border-border focus:border-primary"
    />
  )
}

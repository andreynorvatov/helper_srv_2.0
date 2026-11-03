import { useState } from 'react'
import Card from '../ui/Card'
import Button from '../ui/Button'

export default function ProfileTab() {
  const [a, setA] = useState('')
  const [b, setB] = useState('')
  const [c, setC] = useState('')
  const [result, setResult] = useState<number | null>(null)

  function calculate() {
    const na = Number(a)
    const nb = Number(b)
    const nc = Number(c)
    if (a === '' || b === '' || c === '' || Number.isNaN(na) || Number.isNaN(nb) || Number.isNaN(nc)) {
      setResult(null)
      return
    }
    // Заглушка: формула заменится позже.
    setResult(na + nb + nc)
  }

  const fields: Array<{ label: string; value: string; onChange: (v: string) => void }> = [
    { label: 'a', value: a, onChange: setA },
    { label: 'b', value: b, onChange: setB },
    { label: 'c', value: c, onChange: setC },
  ]

  return (
    <Card title="Расчёт профиля">
      <p className="text-sm text-slate-600 mb-4">
        Заглушка: результат = a + b + c. Формула заменится позже.
      </p>
      <div className="flex flex-wrap gap-4 mb-4">
        {fields.map((field) => (
          <label key={field.label} className="flex flex-col gap-1">
            <span className="text-sm text-slate-600">{field.label}</span>
            <input
              type="number"
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </label>
        ))}
      </div>
      <Button onClick={calculate}>Рассчитать</Button>
      {result !== null && (
        <p className="mt-4 text-lg font-semibold">
          Результат: <span className="text-slate-900">{result}</span>
        </p>
      )}
    </Card>
  )
}

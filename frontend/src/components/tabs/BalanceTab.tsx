import { useBalance } from '../../hooks/useBalance'
import Card from '../ui/Card'

export default function BalanceTab() {
  const { balance } = useBalance()

  const rows: Array<{ label: string; value: number }> = [
    { label: 'Кредиты', value: balance.credits },
    { label: 'Лимит', value: balance.limit },
    { label: 'Использовано', value: balance.usage },
  ]

  return (
    <Card title="Баланс OpenRouter">
      <p className="text-sm text-muted mb-4">
        Мок-данные. Эндпоинт <code className="bg-surface px-1 rounded">GET /api/v1/balance</code> ещё не готов.
      </p>
      <dl className="space-y-3">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between border-b border-border pb-2">
            <dt className="text-sm text-muted">{row.label}</dt>
            <dd className="text-lg font-semibold">{row.value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  )
}

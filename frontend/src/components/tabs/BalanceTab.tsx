import { useBalance } from '../../hooks/useBalance'
import Card from '../ui/Card'
import Button from '../ui/Button'

function fmtMoney(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function fmtRub(value: number | null): string | null {
  if (value === null) return null
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(value)
}

interface MoneyRow {
  label: string
  value: string
  rub: number | null
}

export default function BalanceTab() {
  const { balance, loading, error, refresh } = useBalance()

  if (loading && !balance) {
    return (
      <Card title="Баланс OpenRouter">
        <p className="text-sm text-muted">Загрузка баланса…</p>
      </Card>
    )
  }

  if (error && !balance) {
    return (
      <Card title="Баланс OpenRouter">
        <p className="text-sm text-danger mb-4">Не удалось получить баланс: {error}</p>
        <Button onClick={() => void refresh()}>Повторить</Button>
      </Card>
    )
  }

  if (!balance) {
    return (
      <Card title="Баланс OpenRouter">
        <p className="text-sm text-muted">Нет данных о балансе.</p>
      </Card>
    )
  }

  const unlimited = balance.limit <= 0
  const usagePct = balance.limit > 0 ? (balance.usage / balance.limit) * 100 : 0
  const lowBalance = balance.limit > 0 && usagePct >= 80
  const barColor = lowBalance ? 'var(--danger)' : 'var(--success)'

  const rows: MoneyRow[] = [
    {
      label: 'Остаток',
      value: unlimited ? 'Без лимита' : fmtMoney(balance.credits ?? 0),
      rub: unlimited ? null : balance.rub_credits,
    },
    { label: 'Лимит', value: unlimited ? 'Без лимита' : fmtMoney(balance.limit), rub: unlimited ? null : balance.rub_limit },
    { label: 'Потрачено всего', value: fmtMoney(balance.usage), rub: balance.rub_usage },
  ]

  const usageRows: MoneyRow[] = [
    { label: 'За сегодня', value: fmtMoney(balance.usage_daily), rub: balance.rub_usage_daily },
    { label: 'За неделю', value: fmtMoney(balance.usage_weekly), rub: balance.rub_usage_weekly },
    { label: 'За месяц', value: fmtMoney(balance.usage_monthly), rub: balance.rub_usage_monthly },
  ]

  const accountRows: MoneyRow[] = [
    { label: 'Всего кредитов', value: fmtMoney(balance.total_credits), rub: balance.rub_total_credits },
    { label: 'Потрачено', value: fmtMoney(balance.total_usage), rub: balance.rub_total_usage },
    { label: 'Остаток', value: fmtMoney(balance.remaining_credits), rub: balance.rub_remaining_credits },
  ]

  const rateLabel =
    balance.usd_rub_rate !== null
      ? `Курс: 1 USD ≈ ${fmtRub(balance.usd_rub_rate) ?? balance.usd_rub_rate}`
      : null

  return (
    <Card title="Баланс OpenRouter">
      <div className="mb-4 flex items-center justify-between gap-4">
        <p className="text-sm text-muted">
          {balance.label ? `Ключ: ${balance.label}` : 'Баланс ключа OpenRouter'}
          {balance.is_free_tier ? ' · бесплатный тариф' : ''}
          {rateLabel ? ` · ${rateLabel}` : ''}
        </p>
        <Button onClick={() => void refresh()} disabled={loading} className="shrink-0">
          {loading ? 'Обновление…' : '↻ Обновить'}
        </Button>
      </div>

      {error && <p className="text-sm text-danger mb-4">Ошибка обновления: {error}</p>}

      <dl className="space-y-3">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between border-b border-border pb-2">
            <dt className="text-sm text-muted">{row.label}</dt>
            <dd className="text-right">
              <span className="text-lg font-semibold">{row.value}</span>
              {row.rub !== null && (
                <span className="block text-xs text-muted">≈ {fmtRub(row.rub)}</span>
              )}
            </dd>
          </div>
        ))}
      </dl>

      <h3 className="mt-6 text-sm font-semibold text-foreground">Баланс аккаунта</h3>
      <dl className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {accountRows.map((row) => (
          <div key={row.label} className="rounded-lg border border-border bg-background p-4">
            <dt className="text-xs font-medium text-muted">{row.label}</dt>
            <dd className="mt-1 text-lg font-bold text-foreground">{row.value}</dd>
            {row.rub !== null && (
              <dd className="text-xs text-muted">≈ {fmtRub(row.rub)}</dd>
            )}
          </div>
        ))}
      </dl>

      <h3 className="mt-6 text-sm font-semibold text-foreground">Расходы по периодам</h3>
      <dl className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {usageRows.map((row) => (
          <div key={row.label} className="rounded-lg border border-border bg-background p-4">
            <dt className="text-xs font-medium text-muted">{row.label}</dt>
            <dd className="mt-1 text-lg font-bold text-foreground">{row.value}</dd>
            {row.rub !== null && (
              <dd className="text-xs text-muted">≈ {fmtRub(row.rub)}</dd>
            )}
          </div>
        ))}
      </dl>

      {!unlimited && (
        <div className="mt-5">
          <div className="mb-1.5 flex items-center justify-between text-xs text-muted">
            <span>Использовано лимита</span>
            <span>{usagePct.toFixed(1)}%</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-background border border-border">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${Math.min(usagePct, 100)}%`, backgroundColor: barColor }}
            />
          </div>
        </div>
      )}
    </Card>
  )
}

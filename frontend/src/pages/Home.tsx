import { useState } from 'react'

interface HealthResponse {
  status: string
}

interface FetchResponse {
  [key: string]: unknown
}

export default function Home() {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [source, setSource] = useState('')
  const [data, setData] = useState<FetchResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function checkHealth() {
    setError(null)
    try {
      const resp = await fetch('/api/health')
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
      setHealth((await resp.json()) as HealthResponse)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка запроса')
    }
  }

  async function fetchSource() {
    if (!source.trim()) {
      setError('Укажи имя источника (source)')
      return
    }
    setError(null)
    setData(null)
    setLoading(true)
    try {
      const resp = await fetch(`/api/v1/fetch?source=${encodeURIComponent(source.trim())}`)
      if (!resp.ok) {
        const body = (await resp.json()) as { detail?: string }
        throw new Error(body.detail ?? `HTTP ${resp.status}`)
      }
      setData((await resp.json()) as FetchResponse)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка запроса')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
        <h2 className="text-xl font-semibold mb-2">Проверка связи с беком</h2>
        <p className="text-sm text-slate-600 mb-4">
          Запрос <code className="bg-slate-100 px-1 rounded">GET /api/health</code> — в dev
          проксируется Vite на localhost:8000.
        </p>
        <button
          onClick={checkHealth}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Проверить бек
        </button>
        {health && (
          <pre className="mt-4 rounded-lg bg-slate-900 p-4 text-sm text-green-400">
            {JSON.stringify(health, null, 2)}
          </pre>
        )}
      </section>

      <section className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
        <h2 className="text-xl font-semibold mb-2">Fetch-прокси к внешнему API</h2>
        <p className="text-sm text-slate-600 mb-4">
          Источник настраивается в <code className="bg-slate-100 px-1 rounded">.env</code>:
          <code className="bg-slate-100 px-1 rounded">{'EXTERNAL_API_URL_<NAME>'}</code>.
        </p>
        <div className="flex gap-2">
          <input
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="например: weather"
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
          />
          <button
            onClick={fetchSource}
            disabled={loading}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
          >
            {loading ? 'Загрузка…' : 'Запросить'}
          </button>
        </div>
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        {data && (
          <pre className="mt-4 max-h-96 overflow-auto rounded-lg bg-slate-900 p-4 text-sm text-green-400">
            {JSON.stringify(data, null, 2)}
          </pre>
        )}
      </section>
    </div>
  )
}
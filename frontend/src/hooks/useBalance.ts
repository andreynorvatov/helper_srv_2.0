import { useCallback, useEffect, useState } from 'react'
import type { Balance } from '../types'

const API_BASE = import.meta.env.VITE_API_BASE ?? ''

interface UseBalanceResult {
  balance: Balance | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useBalance(): UseBalanceResult {
  const [balance, setBalance] = useState<Balance | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/api/v1/balance`)
      if (!res.ok) {
        let detail = `HTTP ${res.status}`
        try {
          const body = await res.json()
          if (body?.detail) detail = String(body.detail)
        } catch {
          /* тело не JSON — оставляем HTTP-статус */
        }
        throw new Error(detail)
      }
      const data = (await res.json()) as Balance
      setBalance(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось получить баланс')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { balance, loading, error, refresh }
}

import { useState } from 'react'
import type { Balance } from '../types'

// Мок баланса OpenRouter. Эндпоинт GET /api/v1/balance ещё не готов —
// когда появится, заменим мок на fetch.
const MOCK_BALANCE: Balance = {
  credits: 12.5,
  limit: 100,
  usage: 87.5,
}

export function useBalance() {
  const [balance] = useState<Balance>(MOCK_BALANCE)
  return { balance }
}

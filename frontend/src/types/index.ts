export type TabId = 'balance' | 'profile' | 'docs'

export interface Balance {
  credits: number
  limit: number
  usage: number
}

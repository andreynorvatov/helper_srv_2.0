import type { ReactNode } from 'react'
import type { TabId } from '../types'
import Tabs from './ui/Tabs'

interface LayoutProps {
  activeTab: TabId
  onTabChange: (id: TabId) => void
  children: ReactNode
}

const TABS: Array<{ id: TabId; label: string }> = [
  { id: 'balance', label: 'Баланс' },
  { id: 'profile', label: 'Расчёт профиля' },
  { id: 'docs', label: 'API Docs' },
]

export default function Layout({ activeTab, onTabChange, children }: LayoutProps) {
  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      <aside className="w-56 shrink-0 bg-slate-900 text-white flex flex-col">
        <div className="px-4 py-5">
          <h1 className="text-lg font-semibold">Helper Service</h1>
        </div>
        <Tabs tabs={TABS} active={activeTab} onChange={onTabChange} />
      </aside>

      <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-8">{children}</main>
    </div>
  )
}

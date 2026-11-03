import type { TabId } from '../../types'

interface TabItem {
  id: TabId
  label: string
}

interface TabsProps {
  tabs: TabItem[]
  active: TabId
  onChange: (id: TabId) => void
}

export default function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <nav className="flex flex-col gap-1 px-2">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`relative flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            active === tab.id
              ? 'bg-sidebar-active text-sidebar-foreground'
              : 'text-muted hover:bg-sidebar-active hover:text-sidebar-foreground'
          }`}
        >
          {active === tab.id && (
            <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary" />
          )}
          {tab.label}
        </button>
      ))}
    </nav>
  )
}

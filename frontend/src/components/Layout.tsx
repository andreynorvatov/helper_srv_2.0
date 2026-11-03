import type { ReactNode } from 'react'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <header className="bg-slate-900 text-white">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold">Helper Service</h1>
          <span className="text-sm text-slate-400">FastAPI + React</span>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-8">{children}</main>

      <footer className="border-t border-slate-200">
        <div className="mx-auto max-w-5xl px-4 py-4 text-sm text-slate-500">
          Данные из внешних API — через бек-прокси, ключи на сервере.
        </div>
      </footer>
    </div>
  )
}
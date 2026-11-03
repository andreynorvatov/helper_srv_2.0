import type { ReactNode } from 'react'

interface CardProps {
  title?: string
  children: ReactNode
}

export default function Card({ title, children }: CardProps) {
  return (
    <section className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
      {title && <h2 className="text-xl font-semibold mb-4">{title}</h2>}
      {children}
    </section>
  )
}

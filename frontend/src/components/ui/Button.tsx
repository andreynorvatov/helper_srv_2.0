import type { ButtonHTMLAttributes } from 'react'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>

export default function Button({ className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      {...props}
    />
  )
}

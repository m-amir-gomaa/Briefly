import type { InputHTMLAttributes } from 'react'

export default function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={[
        'min-h-11 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-950 outline-none transition-all duration-200 ease-in-out placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100',
        className,
      ].join(' ')}
      {...props}
    />
  )
}

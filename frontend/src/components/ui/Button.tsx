import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: ReactNode
}

const variantClass: Record<ButtonVariant, string> = {
  primary: 'bg-zinc-950 text-white shadow-sm hover:bg-zinc-800',
  secondary: 'border border-zinc-200 bg-white text-zinc-800 hover:border-zinc-300 hover:bg-zinc-50',
  ghost: 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950',
  danger: 'bg-red-600 text-white shadow-sm hover:bg-red-700',
}

const sizeClass: Record<ButtonSize, string> = {
  sm: 'min-h-9 px-3 text-xs',
  md: 'min-h-10 px-4 text-sm',
  lg: 'min-h-12 px-5 text-sm',
}

export default function Button({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  icon,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-all duration-200 ease-in-out focus:outline-none focus:ring-4 focus:ring-zinc-200 disabled:pointer-events-none disabled:opacity-50',
        variantClass[variant],
        sizeClass[size],
        className,
      ].join(' ')}
      {...props}
    >
      {icon}
      {children}
    </button>
  )
}

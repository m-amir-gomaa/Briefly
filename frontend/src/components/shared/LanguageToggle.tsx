interface LanguageToggleProps {
  value?: 'en' | 'ar'
  onChange?: (value: 'en' | 'ar') => void
}

export default function LanguageToggle({ value = 'en', onChange }: LanguageToggleProps) {
  return (
    <div className="inline-grid grid-cols-2 rounded-md border border-zinc-200 bg-white p-1 text-xs font-semibold shadow-sm">
      {[
        { value: 'en' as const, label: 'EN' },
        { value: 'ar' as const, label: 'AR' },
      ].map((item) => (
        <button
          key={item.value}
          type="button"
          onClick={() => onChange?.(item.value)}
          className={[
            'rounded px-2.5 py-1.5 text-center transition-all duration-200 ease-in-out',
            value === item.value ? 'bg-zinc-950 text-white' : 'text-zinc-500 hover:text-zinc-950',
          ].join(' ')}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}

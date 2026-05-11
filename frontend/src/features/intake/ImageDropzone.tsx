import { useEffect, useRef, useState } from 'react'
import type { DragEvent } from 'react'
import { Image, Upload, X } from 'lucide-react'

interface ImageDropzoneProps {
  imageFile: File | null
  disabled?: boolean
  onChange: (file: File | null) => void
}

function formatBytes(size: number) {
  if (!size) return '0 KB'
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

export default function ImageDropzone({ imageFile, disabled, onChange }: ImageDropzoneProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!imageFile) {
      setPreview(null)
      return
    }

    const nextPreview = URL.createObjectURL(imageFile)
    setPreview(nextPreview)

    return () => URL.revokeObjectURL(nextPreview)
  }, [imageFile])

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragOver(false)

    const file = event.dataTransfer.files[0]
    if (file?.type.startsWith('image/')) onChange(file)
  }

  if (imageFile && preview) {
    return (
      <div className="overflow-hidden rounded-md border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800">
        <div className="relative">
          <img src={preview} alt="" className="h-32 w-full object-cover" />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute right-2 top-2 rounded-md bg-white/80 p-2 text-zinc-600 shadow-sm backdrop-blur-xl transition-all duration-200 ease-in-out hover:bg-white hover:text-zinc-950"
            aria-label="Remove image"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center justify-between gap-3 px-3 py-2 text-xs text-zinc-500 dark:text-zinc-400">
          <span className="truncate">{imageFile.name}</span>
          <span className="shrink-0">{formatBytes(imageFile.size)}</span>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div
        onDragOver={(event) => {
          event.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className={[
          'flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed px-4 py-5 text-center transition-all duration-200 ease-in-out',
          dragOver
            ? 'border-zinc-500 bg-zinc-100 text-zinc-950 dark:bg-zinc-700 dark:text-zinc-100'
            : 'border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 hover:text-zinc-950 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-100',
          disabled ? 'pointer-events-none opacity-50' : '',
        ].join(' ')}
      >
        <div className="flex items-center gap-2">
          <Image className="h-4 w-4" />
          <Upload className="h-4 w-4" />
        </div>
        <p className="mt-2 text-sm font-semibold">Drop image or browse</p>
        <p className="mt-1 text-xs">Whiteboards, screenshots, sketches</p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) onChange(file)
        }}
      />
    </div>
  )
}

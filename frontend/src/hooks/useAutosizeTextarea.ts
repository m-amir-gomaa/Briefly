import { useLayoutEffect, type RefObject } from 'react'

export default function useAutosizeTextarea(
  ref: RefObject<HTMLTextAreaElement | null>,
  value: string,
) {
  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return

    element.style.height = 'auto'
    element.style.height = `${Math.max(element.scrollHeight, 320)}px`
  }, [ref, value])
}

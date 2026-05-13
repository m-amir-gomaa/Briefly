import { useState, useEffect, useCallback, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

interface Slide {
  headline: string
  description: string
}

const slides: Slide[] = [
  {
    headline: 'Untidy ideas and additions?\nBriefly organize them',
    description:
      'Briefly is an AI-powered B2B SaaS platform built for agencies to automate client onboarding and project scoping.',
  },
  {
    headline: 'Voice memos, screenshots,\nraw notes — all welcome',
    description:
      'Drop in any format of client input. Briefly ingests text, audio recordings, and images, then weaves them into one coherent document.',
  },
  {
    headline: 'From chaos to clarity\nin under a minute',
    description:
      'Our AI engine extracts goals, scope, risks, and next steps — delivering a structured brief your clients can review and approve instantly.',
  },
]

const SLIDE_DURATION_MS = 6000

export default function FeatureShowcase() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const startTimeRef = useRef(Date.now())
  const rafRef = useRef<number>(0)

  const advance = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % slides.length)
    setProgress(0)
    startTimeRef.current = Date.now()
  }, [])

  // Animation frame loop for smooth progress
  
  useEffect(() => {
    startTimeRef.current = Date.now()

    function tick() {
      const elapsed = Date.now() - startTimeRef.current
      const pct = Math.min(elapsed / SLIDE_DURATION_MS, 1)
      setProgress(pct)

      if (pct >= 1) {
        advance()
      } else {
        rafRef.current = requestAnimationFrame(tick)
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [activeIndex, advance])

  const goToSlide = (index: number) => {
    setActiveIndex(index)
    setProgress(0)
    startTimeRef.current = Date.now()
  }

  const currentSlide = slides[activeIndex]

  return (
    <section className="mt-16 sm:mt-20">
      {/* Section heading */}
      <div className="mb-10 mt-12 flex justify-center text-center sm:mb-12">
        <h2 className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-2 text-2xl font-semibold tracking-normal text-zinc-950 sm:text-3xl md:text-4xl">
          <span className="italic text-zinc-500 dark:text-zinc-400">What Does</span>
          <img src="/title-black.png" alt="Briefly" className="h-8 object-contain sm:h-10 dark:invert" />
          <span className="italic text-zinc-500 dark:text-zinc-400">Really do?</span>
        </h2>
      </div>

      {/* Content area */}
      <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-12">
        {/* Left — Text carousel */}
        <div className="flex flex-col">
          <div className="relative min-h-[200px] sm:min-h-[220px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
              >
                <h3 className="whitespace-pre-line text-2xl font-bold leading-tight tracking-normal text-zinc-950 sm:text-3xl lg:text-[2.1rem] dark:text-zinc-50">
                  {currentSlide.headline}
                </h3>
                <p className="mt-4 max-w-lg text-base leading-7 text-zinc-500 dark:text-zinc-400">
                  {currentSlide.description}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Progress indicators */}
          <div className="mt-6 flex items-center gap-2.5">
            {slides.map((_, index) => {
              const isActive = index === activeIndex
              const isPast = index < activeIndex

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => goToSlide(index)}
                  className="group relative h-[6px] flex-shrink-0 overflow-hidden rounded-full transition-all duration-300"
                  style={{ width: isActive ? 48 : 32 }}
                  aria-label={`Go to slide ${index + 1}`}
                >
                  {/* Track */}
                  <span
                    className={[
                      'absolute inset-0 rounded-full transition-colors duration-300',
                      isActive ? 'bg-zinc-300' : isPast ? 'bg-zinc-300' : 'bg-zinc-200',
                    ].join(' ')}
                  />
                  {/* Fill */}
                  <span
                    className="absolute inset-y-0 left-0 rounded-full bg-zinc-950 transition-colors duration-300 dark:bg-zinc-100"
                    style={{
                      width: isActive
                        ? `${progress * 100}%`
                        : isPast
                          ? '100%'
                          : '0%',
                    }}
                  />
                </button>
              )
            })}
          </div>
        </div>

        {/* Right — Media placeholder */}
        <div className="flex items-center justify-center w-full">
          <div className="aspect-video w-full overflow-hidden rounded-2xl border border-zinc-200/50 bg-white/50 backdrop-blur-sm shadow-lg shadow-zinc-200/50 dark:border-zinc-700/50 dark:bg-zinc-900/50 dark:shadow-black/30">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="flex h-full w-full flex-col items-center justify-center p-8"
              >
                {/* Decorative skeleton content — adapts per slide */}
                <div className="w-full max-w-xs space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="h-10 w-10 shrink-0 rounded-xl bg-zinc-100 dark:bg-zinc-800" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-3/4 rounded-full bg-zinc-100 dark:bg-zinc-800" />
                      <div className="h-2.5 w-1/2 rounded-full bg-zinc-50 dark:bg-zinc-800/60" />
                    </div>
                  </div>

                  <div className="space-y-2.5 pt-2">
                    <div className="h-3 w-full rounded-full bg-zinc-100 dark:bg-zinc-800" />
                    <div className="h-3 w-5/6 rounded-full bg-zinc-100 dark:bg-zinc-800" />
                    <div className="h-3 w-2/3 rounded-full bg-zinc-50 dark:bg-zinc-800/60" />
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-3">
                    <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-800/50">
                      <div className="h-2.5 w-3/4 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                      <div className="mt-2 h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-700/60" />
                    </div>
                    <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-800/50">
                      <div className="h-2.5 w-1/2 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                      <div className="mt-2 h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-700/60" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="h-2.5 w-20 rounded-full bg-zinc-100 dark:bg-zinc-800" />
                    <div className="h-7 w-20 rounded-full bg-zinc-950 dark:bg-zinc-100" />
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}

import { useState, useMemo, useEffect } from 'react'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, FilePlus2, CheckCircle2, Circle, Clock, FileText, LayoutDashboard, Zap } from 'lucide-react'
import Card from '../components/ui/Card'
import { listIntakes, IntakeRecord } from '../services/api'

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function isSameDay(d1: Date | null, d2: Date | null) {
  if (!d1 || !d2) return false
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate()
}

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  
  const [intakes, setIntakes] = useState<IntakeRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listIntakes()
      .then(setIntakes)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const days = useMemo(() => {
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const firstDay = new Date(year, month, 1).getDay()
    
    const res: (Date | null)[] = []
    for (let i = 0; i < firstDay; i++) {
      res.push(null)
    }
    for (let i = 1; i <= daysInMonth; i++) {
      res.push(new Date(year, month, i))
    }
    return res
  }, [year, month])

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))

  const selectedDateStr = selectedDate.toDateString()
  const dayIntakes = intakes.filter(i => new Date(i.created_at).toDateString() === selectedDateStr)
  
  // Intake counts for calendar indicators
  const intakesByDate = useMemo(() => {
    const counts: Record<string, { total: number; pending: number }> = {}
    intakes.forEach(i => {
      const dStr = new Date(i.created_at).toDateString()
      if (!counts[dStr]) counts[dStr] = { total: 0, pending: 0 }
      counts[dStr].total++
      if (i.status === 'PENDING' || i.status === 'PROCESSING') counts[dStr].pending++
    })
    return counts
  }, [intakes])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">Calendar</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Plan your schedule and stay on top of daily tasks.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[1fr_400px]">
        {/* Left: Full Calendar */}
        <Card className="flex flex-col p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-zinc-950 dark:text-zinc-100">
              {MONTHS[month]} {year}
            </h2>
            <div className="flex items-center gap-1">
              <button
                onClick={prevMonth}
                className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-600 dark:text-zinc-400"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => {
                  const d = new Date()
                  setCurrentDate(new Date(d.getFullYear(), d.getMonth(), 1))
                  setSelectedDate(new Date(d.getFullYear(), d.getMonth(), d.getDate()))
                }}
                className="px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
              >
                Today
              </button>
              <button
                onClick={nextMonth}
                className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-600 dark:text-zinc-400"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-px rounded-xl border border-zinc-200 bg-zinc-200 overflow-hidden dark:border-zinc-800 dark:bg-zinc-800">
            {WEEKDAYS.map(day => (
              <div key={day} className="bg-zinc-50/80 py-3 text-center text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:bg-zinc-900/80 dark:text-zinc-400">
                {day}
              </div>
            ))}
            
            {days.map((date, idx) => {
              if (!date) {
                return <div key={`empty-${idx}`} className="bg-white min-h-[100px] dark:bg-zinc-900/40" />
              }

              const isSelected = isSameDay(date, selectedDate)
              const isToday = isSameDay(date, new Date())
              const dateStr = date.toDateString()
              const taskInfo = intakesByDate[dateStr]

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDate(date)}
                  className={[
                    'relative min-h-[100px] bg-white p-2 flex flex-col items-start transition-colors dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 focus:outline-none',
                    isSelected ? 'ring-2 ring-inset ring-zinc-950 z-10 dark:ring-zinc-100' : ''
                  ].join(' ')}
                >
                  <span
                    className={[
                      'flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium',
                      isToday
                        ? 'bg-blue-600 text-white'
                        : isSelected
                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                        : 'text-zinc-700 dark:text-zinc-300'
                    ].join(' ')}
                  >
                    {date.getDate()}
                  </span>

                  {taskInfo && taskInfo.total > 0 && (
                    <div className="mt-auto w-full pt-2">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                        <div className={[
                          "h-1.5 w-1.5 rounded-full",
                          taskInfo.pending > 0 ? "bg-amber-500" : "bg-emerald-500"
                        ].join(' ')} />
                        {taskInfo.total} {taskInfo.total === 1 ? 'brief' : 'briefs'}
                      </div>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </Card>

        {/* Right: To-Do System */}
        <Card className="flex h-full flex-col p-0 overflow-hidden border-zinc-200 dark:border-zinc-800">
          <div className="border-b border-zinc-100 bg-zinc-50/50 px-5 py-4 dark:border-zinc-800 dark:bg-zinc-900/50">
            <h3 className="text-lg font-semibold text-zinc-950 dark:text-zinc-100 flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-blue-500" />
              Intakes for {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' })}
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 text-center opacity-60">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-500 dark:border-zinc-800 dark:border-t-zinc-400" />
              </div>
            ) : dayIntakes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center opacity-60">
                <CheckCircle2 className="h-10 w-10 text-zinc-400 mb-3" />
                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">No intakes for this day.</p>
                <p className="mt-1 text-xs text-zinc-500">Take a break!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {dayIntakes.map(intake => (
                  <div
                    key={intake.id}
                    className="group flex flex-col gap-2 rounded-xl border border-zinc-200 p-4 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {intake.status === 'COMPLETED' ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                        ) : intake.status === 'FAILED' ? (
                          <Circle className="h-5 w-5 text-red-500" />
                        ) : (
                          <Clock className="h-5 w-5 text-amber-500" />
                        )}
                        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {intake.brief?.client_name || 'Unknown Client'}
                        </span>
                      </div>
                      <span className="text-xs text-zinc-500">{new Date(intake.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    {intake.brief && (
                      <p className="text-sm text-zinc-600 line-clamp-2 dark:text-zinc-400">
                        {intake.brief.summary}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

import { useState, useMemo } from 'react'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, CheckCircle2, Circle, Trash2, CalendarDays } from 'lucide-react'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'

interface Task {
  id: string
  text: string
  date: string
  completed: boolean
}

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
  
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', text: 'Review onboarding requirements', date: new Date().toDateString(), completed: false },
    { id: '2', text: 'Draft follow-up email to stakeholders', date: new Date().toDateString(), completed: true },
  ])
  const [newTaskText, setNewTaskText] = useState('')

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
  const dayTasks = tasks.filter(t => t.date === selectedDateStr)
  
  // Tasks counts for calendar indicators
  const tasksByDate = useMemo(() => {
    const counts: Record<string, { total: number; pending: number }> = {}
    tasks.forEach(t => {
      if (!counts[t.date]) counts[t.date] = { total: 0, pending: 0 }
      counts[t.date].total++
      if (!t.completed) counts[t.date].pending++
    })
    return counts
  }, [tasks])

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskText.trim()) return
    setTasks(prev => [
      ...prev,
      { id: Date.now().toString(), text: newTaskText.trim(), date: selectedDateStr, completed: false }
    ])
    setNewTaskText('')
  }

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t))
  }

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id))
  }

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
              const taskInfo = tasksByDate[dateStr]

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDate(date)}
                  className={[
                    'relative min-h-[100px] bg-white p-2 flex flex-col items-start transition-colors dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 focus:outline-none',
                    isSelected ? 'ring-2 ring-inset ring-zinc-950 dark:ring-zinc-100' : ''
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
                        {taskInfo.pending > 0 ? `${taskInfo.pending} due` : 'Done'}
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
              <CalendarDays className="h-5 w-5 text-blue-500" />
              Tasks for {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' })}
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {dayTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center opacity-60">
                <CheckCircle2 className="h-10 w-10 text-zinc-400 mb-3" />
                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">No tasks for this day.</p>
                <p className="mt-1 text-xs text-zinc-500">Enjoy your free time!</p>
              </div>
            ) : (
              <div className="space-y-1">
                {dayTasks.map(task => (
                  <div
                    key={task.id}
                    className="group flex items-start gap-3 rounded-xl p-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <button
                      onClick={() => toggleTask(task.id)}
                      className="mt-0.5 shrink-0 text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors"
                    >
                      {task.completed ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <Circle className="h-5 w-5" />
                      )}
                    </button>
                    <span
                      className={[
                        'flex-1 text-sm transition-all',
                        task.completed
                          ? 'text-zinc-400 line-through dark:text-zinc-500'
                          : 'text-zinc-700 dark:text-zinc-200'
                      ].join(' ')}
                    >
                      {task.text}
                    </span>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="opacity-0 group-hover:opacity-100 shrink-0 text-zinc-400 hover:text-red-500 dark:hover:text-red-400 transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-zinc-100 p-4 dark:border-zinc-800 bg-white dark:bg-zinc-900 mt-auto">
            <form onSubmit={handleAddTask} className="relative">
              <input
                type="text"
                placeholder="Add a new task..."
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                className="w-full rounded-full border border-zinc-200 bg-zinc-50 py-2.5 pl-4 pr-12 text-sm text-zinc-950 placeholder:text-zinc-400 outline-none transition-colors focus:border-zinc-400 focus:bg-white dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-100 dark:focus:border-zinc-500 dark:focus:bg-zinc-800"
              />
              <button
                type="submit"
                disabled={!newTaskText.trim()}
                className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-zinc-950 text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-950 transition-transform active:scale-95"
              >
                <Plus className="h-4 w-4" />
              </button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  )
}

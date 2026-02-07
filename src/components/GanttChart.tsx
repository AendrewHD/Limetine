'use client'

import { format, differenceInDays, addDays, startOfDay, min, max } from 'date-fns'
import { Task } from '@prisma/client'

interface GanttChartProps {
  tasks: Task[]
}

export default function GanttChart({ tasks }: GanttChartProps) {
  // Determine date range
  let viewStartDate: Date
  let viewEndDate: Date

  if (tasks.length > 0) {
    const dates = tasks.flatMap(t => [new Date(t.startDate), new Date(t.endDate)])
    const minDate = startOfDay(min(dates))
    const maxDate = startOfDay(max(dates))

    // Add some buffer
    viewStartDate = addDays(minDate, -2)
    viewEndDate = addDays(maxDate, 5)
  } else {
    // Default view range if no tasks exist
    const today = startOfDay(new Date())
    viewStartDate = addDays(today, -2)
    viewEndDate = addDays(today, 14)
  }

  const totalDays = differenceInDays(viewEndDate, viewStartDate) + 1
  const days = Array.from({ length: totalDays }, (_, i) => addDays(viewStartDate, i))

  return (
    <div className="overflow-x-auto border rounded-lg dark:border-zinc-700">
      <div className="min-w-[800px]">
        {/* Header */}
        <div className="grid border-b dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800" style={{ gridTemplateColumns: `200px repeat(${totalDays}, minmax(40px, 1fr))` }}>
          <div className="p-2 font-bold border-r dark:border-zinc-700 sticky left-0 bg-gray-50 dark:bg-zinc-800 z-10">Task</div>
          {days.map(day => (
            <div key={day.toISOString()} className="p-2 text-center text-xs border-r border-gray-100 dark:border-zinc-700 last:border-r-0">
              <div className="font-semibold">{format(day, 'd')}</div>
              <div className="text-gray-500">{format(day, 'MMM')}</div>
            </div>
          ))}
        </div>

        {/* Rows */}
        <div className="relative min-h-[100px]">
             {/* Grid background lines */}
            <div className="absolute inset-0 grid pointer-events-none" style={{ gridTemplateColumns: `200px repeat(${totalDays}, minmax(40px, 1fr))` }}>
                <div className="border-r dark:border-zinc-700 bg-white dark:bg-zinc-900 sticky left-0 z-10"></div>
                {days.map(day => (
                    <div key={day.toISOString()} className="border-r border-dashed border-gray-100 dark:border-zinc-800 last:border-r-0"></div>
                ))}
            </div>

            {tasks.length === 0 && (
                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-gray-400 text-sm">No tasks created yet</span>
                 </div>
            )}

            {tasks.map(task => {
              const taskStart = startOfDay(new Date(task.startDate))
              const taskEnd = startOfDay(new Date(task.endDate))

              const startOffset = differenceInDays(taskStart, viewStartDate) + 2 // +1 for name col, +1 for 1-based index
              const duration = differenceInDays(taskEnd, taskStart) + 1 // Inclusive

              return (
                <div key={task.id} className="grid items-center relative h-12 hover:bg-gray-50 dark:hover:bg-zinc-800/50" style={{ gridTemplateColumns: `200px repeat(${totalDays}, minmax(40px, 1fr))` }}>
                  <div className="p-2 truncate font-medium border-r dark:border-zinc-700 bg-white dark:bg-zinc-900 sticky left-0 z-10 w-[200px] h-full flex items-center">
                    {task.name}
                  </div>

                  {/* Task Bar */}
                  <div
                    className="rounded-md bg-blue-500 dark:bg-blue-600 shadow-sm h-8 mx-1 flex items-center justify-center text-xs text-white whitespace-nowrap px-2 z-0 relative"
                    style={{
                      gridColumnStart: startOffset,
                      gridColumnEnd: `span ${duration}`
                    }}
                  >
                     {duration > 1 && <span className="truncate">{task.name}</span>}
                  </div>
                </div>
              )
            })}
        </div>
      </div>
    </div>
  )
}

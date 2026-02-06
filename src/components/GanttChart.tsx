'use client'

import { format, differenceInDays, addDays, startOfDay, min, max } from 'date-fns'
import { Task, Milestone } from '@prisma/client'

type TaskWithMilestones = Task & {
  milestones: Milestone[]
}

interface GanttChartProps {
  tasks: TaskWithMilestones[]
}

const renderShape = (shape: string) => {
    const classes = "text-purple-600 dark:text-purple-400 fill-current";
    switch (shape) {
        case 'square': return <rect x="2" y="2" width="12" height="12" className={classes} />;
        case 'triangle': return <polygon points="8,2 14,14 2,14" className={classes} />;
        case 'diamond': return <polygon points="8,2 14,8 8,14 2,8" className={classes} />;
        case 'star': return <polygon points="8,1 10,6 15,6 11,9 12,14 8,11 4,14 5,9 1,6 6,6" className={classes} />;
        case 'flag': return <path d="M4 2 L12 2 L12 10 L4 10 Z M4 2 L4 14" className={classes} stroke="currentColor" strokeWidth="2" fill="none" />;
        case 'circle':
        default: return <circle cx="8" cy="8" r="6" className={classes} />;
    }
}

export default function GanttChart({ tasks }: GanttChartProps) {
  if (tasks.length === 0) {
    return <div className="text-center p-10 text-gray-500">No tasks found. Add a task to see the timeline.</div>
  }

  // Determine date range
  const dates = tasks.flatMap(t => [
      new Date(t.startDate),
      new Date(t.endDate),
      ...t.milestones.map(m => new Date(m.date))
  ])

  if (dates.length === 0) return null;

  const minDate = startOfDay(min(dates))
  const maxDate = startOfDay(max(dates))

  // Add some buffer
  const viewStartDate = addDays(minDate, -2)
  const viewEndDate = addDays(maxDate, 5)
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
        <div className="relative">
             {/* Grid background lines */}
            <div className="absolute inset-0 grid pointer-events-none" style={{ gridTemplateColumns: `200px repeat(${totalDays}, minmax(40px, 1fr))` }}>
                <div className="border-r dark:border-zinc-700 bg-white dark:bg-zinc-900 sticky left-0 z-10"></div>
                {days.map(day => (
                    <div key={day.toISOString()} className="border-r border-dashed border-gray-100 dark:border-zinc-800 last:border-r-0"></div>
                ))}
            </div>

            {tasks.map(task => {
              const taskStart = startOfDay(new Date(task.startDate))
              const taskEnd = startOfDay(new Date(task.endDate))

              const startOffset = differenceInDays(taskStart, viewStartDate) + 2
              const duration = differenceInDays(taskEnd, taskStart) + 1

              return (
                <div key={task.id} className="grid items-center relative h-12 hover:bg-gray-50 dark:hover:bg-zinc-800/50" style={{ gridTemplateColumns: `200px repeat(${totalDays}, minmax(40px, 1fr))` }}>
                  <div className="p-2 truncate font-medium border-r dark:border-zinc-700 bg-white dark:bg-zinc-900 sticky left-0 z-10 w-[200px] h-full flex items-center">
                    {task.name}
                  </div>

                  {/* Task Bar */}
                  <div
                    className="rounded-md bg-blue-500 dark:bg-blue-600 shadow-sm h-8 mx-1 flex items-center justify-center text-xs text-white whitespace-nowrap px-2 z-0 relative group"
                    style={{
                      gridColumnStart: startOffset,
                      gridColumnEnd: `span ${duration}`
                    }}
                  >
                     {duration > 1 && <span className="truncate">{task.name}</span>}
                  </div>

                  {/* Milestones */}
                  {task.milestones.map(milestone => {
                    const milestoneDate = startOfDay(new Date(milestone.date))
                    const offset = differenceInDays(milestoneDate, viewStartDate) + 2

                    if (offset < 2 || offset > totalDays + 1) return null

                    return (
                        <div
                            key={milestone.id}
                            className="flex flex-col items-center justify-center z-20 pointer-events-auto"
                            style={{
                                gridColumnStart: offset,
                                gridColumnEnd: 'span 1',
                                justifySelf: 'center',
                            }}
                        >
                            <svg viewBox="0 0 16 16" className="w-5 h-5 overflow-visible drop-shadow-sm">
                                {renderShape(milestone.shape)}
                            </svg>
                            <span className="text-[10px] leading-none font-medium bg-white/90 dark:bg-zinc-900/90 px-1 py-0.5 rounded shadow-sm whitespace-nowrap border dark:border-zinc-700">
                                {milestone.name}
                            </span>
                        </div>
                    )
                  })}
                </div>
              )
            })}
        </div>
      </div>
    </div>
  )
}

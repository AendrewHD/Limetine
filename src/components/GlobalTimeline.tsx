'use client'

import { format, differenceInDays, addDays, startOfDay, min, max } from 'date-fns'
import { Project, Task } from '@prisma/client'

type ProjectWithTasks = Project & { tasks: Task[] }

interface GlobalTimelineProps {
  projects: ProjectWithTasks[]
}

export default function GlobalTimeline({ projects }: GlobalTimelineProps) {
  const allTasks = projects.flatMap(p => p.tasks)

  // Determine date range
  let viewStartDate: Date
  let viewEndDate: Date

  if (allTasks.length > 0) {
    const dates = allTasks.flatMap(t => [new Date(t.startDate), new Date(t.endDate)])
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
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Global Timeline</h2>
      <div className="overflow-x-auto border rounded-lg dark:border-zinc-700 bg-white dark:bg-zinc-900">
        <div className="min-w-[800px]">
          {/* Header */}
          <div className="grid border-b dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800" style={{ gridTemplateColumns: `200px repeat(${totalDays}, minmax(40px, 1fr))` }}>
            <div className="p-2 font-bold border-r dark:border-zinc-700 sticky left-0 bg-gray-50 dark:bg-zinc-800 z-20">Project / Task</div>
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

              {projects.map(project => (
                <div key={project.id} className="contents">
                  {/* Project Header Row */}
                  <div className="grid items-center relative h-10 bg-gray-50/50 dark:bg-zinc-800/30" style={{ gridTemplateColumns: `200px repeat(${totalDays}, minmax(40px, 1fr))` }}>
                     <div className="p-2 font-semibold text-sm border-r dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 sticky left-0 z-10 w-[200px] h-full flex items-center truncate">
                        {project.name}
                     </div>
                     <div className="col-span-full"></div>
                  </div>

                  {/* Task Rows */}
                  {project.tasks.map(task => {
                    const taskStart = startOfDay(new Date(task.startDate))
                    const taskEnd = startOfDay(new Date(task.endDate))

                    const startOffset = differenceInDays(taskStart, viewStartDate) + 2
                    const duration = differenceInDays(taskEnd, taskStart) + 1

                    return (
                      <div key={task.id} className="grid items-center relative h-10 hover:bg-gray-50 dark:hover:bg-zinc-800/50" style={{ gridTemplateColumns: `200px repeat(${totalDays}, minmax(40px, 1fr))` }}>
                        <div className="p-2 pl-6 truncate text-sm border-r dark:border-zinc-700 bg-white dark:bg-zinc-900 sticky left-0 z-10 w-[200px] h-full flex items-center">
                          {task.name}
                        </div>

                        {/* Task Bar */}
                        <div
                          className="rounded-md bg-blue-500 dark:bg-blue-600 shadow-sm h-6 mx-1 flex items-center justify-center text-[10px] text-white whitespace-nowrap px-2 z-0 relative"
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
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}

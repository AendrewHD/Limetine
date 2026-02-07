'use client'

import { format, differenceInDays, addDays, startOfDay, min, max, startOfToday } from 'date-fns'
import { Project, Task } from '@prisma/client'
import { useState, useRef } from 'react'
import TaskCreationModal from './TaskCreationModal'
import { updateTask } from '@/app/actions'

type ProjectWithTasks = Project & { tasks: Task[] }

interface GlobalTimelineProps {
  projects: ProjectWithTasks[]
  initialStartDate: Date
  totalDays: number
}

const COLUMN_WIDTH = 50
const SIDEBAR_WIDTH = 200

export default function GlobalTimeline({ projects, initialStartDate, totalDays }: GlobalTimelineProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<Date | null>(null)
  const [dragEnd, setDragEnd] = useState<Date | null>(null)
  const [dragProjectId, setDragProjectId] = useState<string | null>(null)

  const [resizingTask, setResizingTask] = useState<string | null>(null)
  const [resizeEdge, setResizeEdge] = useState<'start' | 'end' | null>(null)
  const [resizeCurrentDate, setResizeCurrentDate] = useState<Date | null>(null)
  const [resizeProjectId, setResizeProjectId] = useState<string | null>(null)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Use props for range
  const viewStartDate = initialStartDate
  // totalDays is passed as prop

  const days = Array.from({ length: totalDays }, (_, i) => addDays(viewStartDate, i))
  const gridTemplateColumns = `${SIDEBAR_WIDTH}px repeat(${totalDays}, ${COLUMN_WIDTH}px)`

  const handleMouseDown = (e: React.MouseEvent, projectId: string) => {
    if ((e.target as HTMLElement).dataset.handle) return;
    if (e.button !== 0) return;
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect()
    const scrollLeft = containerRef.current.scrollLeft
    const x = e.clientX - rect.left + scrollLeft - SIDEBAR_WIDTH

    if (x < 0) return

    const dayIndex = Math.floor(x / COLUMN_WIDTH)
    const date = addDays(viewStartDate, dayIndex)

    setIsDragging(true)
    setDragProjectId(projectId)
    setDragStart(date)
    setDragEnd(date)
  }

  const handleResizeStart = (e: React.MouseEvent, taskId: string, projectId: string, edge: 'start' | 'end', initialDate: Date) => {
    e.stopPropagation()
    e.preventDefault()
    setResizingTask(taskId)
    setResizeProjectId(projectId)
    setResizeEdge(edge)
    setResizeCurrentDate(startOfDay(initialDate))
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if ((!isDragging && !resizingTask) || !containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const scrollLeft = containerRef.current.scrollLeft
    const x = e.clientX - rect.left + scrollLeft - SIDEBAR_WIDTH

    const dayIndex = Math.floor(x / COLUMN_WIDTH)
    const date = addDays(viewStartDate, dayIndex)

    if (isDragging && dragStart) {
      setDragEnd(date)
    } else if (resizingTask && resizeEdge) {
      setResizeCurrentDate(date)
    }
  }

  const handleMouseUp = async () => {
    if (isDragging) {
      setIsDragging(false)
      setIsModalOpen(true)
    } else if (resizingTask && resizeEdge && resizeCurrentDate && resizeProjectId) {
      const data = resizeEdge === 'start' ? { startDate: resizeCurrentDate } : { endDate: resizeCurrentDate };
      // Note: We are not validating start < end here, allowing flexibility or server side validation
      // But visually we swap if needed in render
      await updateTask(resizingTask, resizeProjectId, data);
      setResizingTask(null)
      setResizeEdge(null)
      setResizeCurrentDate(null)
      setResizeProjectId(null)
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Global Timeline</h2>

      <TaskCreationModal
        isOpen={isModalOpen}
        onClose={() => {
            setIsModalOpen(false);
            setDragStart(null);
            setDragEnd(null);
            setDragProjectId(null);
        }}
        initialStartDate={dragStart && dragEnd ? (dragStart < dragEnd ? dragStart : dragEnd) : undefined}
        initialEndDate={dragStart && dragEnd ? (dragStart < dragEnd ? dragEnd : dragStart) : undefined}
        projectId={dragProjectId || ''}
        projects={projects}
      />

      <div
        ref={containerRef}
        className="overflow-x-auto border rounded-lg dark:border-zinc-700 bg-white dark:bg-zinc-900 select-none"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => { if(isDragging || resizingTask) handleMouseUp() }}
      >
        <div className="min-w-[800px]">
          {/* Header */}
          <div className="grid border-b dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800" style={{ gridTemplateColumns }}>
            <div className="p-2 font-bold border-r dark:border-zinc-700 sticky left-0 bg-gray-50 dark:bg-zinc-800 z-20">Project / Task</div>
            {days.map(day => (
              <div key={day.toISOString()} className="p-2 text-center text-xs border-r border-gray-100 dark:border-zinc-700 last:border-r-0" style={{ width: COLUMN_WIDTH }}>
                <div className="font-semibold" suppressHydrationWarning>{format(day, 'd')}</div>
                <div className="text-gray-500" suppressHydrationWarning>{format(day, 'MMM')}</div>
              </div>
            ))}
          </div>

          {/* Rows */}
          <div className="relative">
              <div className="absolute inset-0 grid pointer-events-none" style={{ gridTemplateColumns }}>
                  <div className="border-r dark:border-zinc-700 bg-white dark:bg-zinc-900 sticky left-0 z-10"></div>
                  {days.map(day => (
                      <div key={day.toISOString()} className="border-r border-dashed border-gray-100 dark:border-zinc-800 last:border-r-0"></div>
                  ))}
              </div>

              {projects.map(project => (
                <div key={project.id} className="contents">
                  <div
                    className="grid items-center relative h-10 bg-gray-50/50 dark:bg-zinc-800/30 group cursor-crosshair"
                    style={{ gridTemplateColumns }}
                    onMouseDown={(e) => handleMouseDown(e, project.id)}
                  >
                     <div className="p-2 font-semibold text-sm border-r dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 sticky left-0 z-10 w-[200px] h-full flex items-center truncate">
                        {project.name}
                     </div>

                     {isDragging && dragProjectId === project.id && dragStart && dragEnd && (
                        <div
                            className="rounded-md h-6 mx-1 flex items-center justify-center text-[10px] text-white whitespace-nowrap px-2 z-0 relative opacity-50 pointer-events-none"
                            style={{
                                backgroundColor: project.color || '#3b82f6',
                                gridColumnStart: differenceInDays(dragStart < dragEnd ? dragStart : dragEnd, viewStartDate) + 2,
                                gridColumnEnd: `span ${differenceInDays(dragStart < dragEnd ? dragEnd : dragStart, dragStart < dragEnd ? dragStart : dragEnd) + 1}`
                            }}
                        >
                            New Task
                        </div>
                     )}
                  </div>

                  {project.tasks.map(task => {
                    let taskStart = startOfDay(new Date(task.startDate))
                    let taskEnd = startOfDay(new Date(task.endDate))

                    // Apply resize override if applicable
                    if (resizingTask === task.id && resizeCurrentDate) {
                        if (resizeEdge === 'start') taskStart = resizeCurrentDate
                        if (resizeEdge === 'end') taskEnd = resizeCurrentDate
                    }

                    // Ensure start <= end for visual stability
                    const effectiveStart = taskStart < taskEnd ? taskStart : taskEnd
                    const effectiveEnd = taskStart < taskEnd ? taskEnd : taskStart

                    const startOffset = differenceInDays(effectiveStart, viewStartDate) + 2
                    const duration = differenceInDays(effectiveEnd, effectiveStart) + 1

                    return (
                      <div
                        key={task.id}
                        className="grid items-center relative h-10 hover:bg-gray-50 dark:hover:bg-zinc-800/50"
                        style={{ gridTemplateColumns }}
                        onMouseDown={(e) => handleMouseDown(e, project.id)}
                      >
                        <div className="p-2 pl-6 truncate text-sm border-r dark:border-zinc-700 bg-white dark:bg-zinc-900 sticky left-0 z-10 w-[200px] h-full flex items-center">
                          {task.name}
                        </div>

                        <div
                          className="rounded-md shadow-sm h-6 mx-1 flex items-center justify-center text-[10px] text-white whitespace-nowrap px-2 z-0 relative group/task"
                          style={{
                            backgroundColor: project.color || '#3b82f6',
                            gridColumnStart: startOffset,
                            gridColumnEnd: `span ${duration}`
                          }}
                        >
                          {/* Resize Handles - VISIBLE INDICATORS */}
                          <div
                             className="absolute left-0 top-1 bottom-1 w-2 cursor-w-resize z-20 hover:bg-black/20 bg-white/30 rounded-full flex items-center justify-center transition-colors"
                             data-handle="true"
                             onMouseDown={(e) => handleResizeStart(e, task.id, project.id, 'start', effectiveStart)}
                          />
                          <div
                             className="absolute right-0 top-1 bottom-1 w-2 cursor-e-resize z-20 hover:bg-black/20 bg-white/30 rounded-full flex items-center justify-center transition-colors"
                             data-handle="true"
                             onMouseDown={(e) => handleResizeStart(e, task.id, project.id, 'end', effectiveEnd)}
                          />

                          {duration > 1 && <span className="truncate pointer-events-none">{task.name}</span>}
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

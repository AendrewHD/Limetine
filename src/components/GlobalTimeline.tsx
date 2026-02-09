'use client'

import { format, differenceInDays, addDays, startOfDay, min, max } from 'date-fns'
import { Project, Task, Milestone } from '@prisma/client'
import { useState, useRef } from 'react'
import { updateTask } from '@/app/actions'
import TaskCreationModal from './TaskCreationModal'
import MilestoneCreationModal from './MilestoneCreationModal'

type TaskWithMilestones = Task & { milestones: Milestone[] }
type ProjectWithTasks = Project & { tasks: TaskWithMilestones[] }

interface GlobalTimelineProps {
  projects: ProjectWithTasks[]
}

const COLUMN_WIDTH = 50
const SIDEBAR_WIDTH = 200

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

export default function GlobalTimeline({ projects }: GlobalTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Interactive State
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<Date | null>(null)
  const [dragEnd, setDragEnd] = useState<Date | null>(null)
  const [dragProjectId, setDragProjectId] = useState<string | null>(null)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false)

  const [clickedTaskId, setClickedTaskId] = useState<string | null>(null)

  const [resizingTask, setResizingTask] = useState<string | null>(null)
  const [resizeProjectId, setResizeProjectId] = useState<string | null>(null)
  const [resizeEdge, setResizeEdge] = useState<'start' | 'end' | null>(null)
  const [resizeCurrentDate, setResizeCurrentDate] = useState<Date | null>(null)

  const allTasks = projects.flatMap(p => p.tasks)

  if (projects.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Global Timeline</h2>
        <div className="border rounded-lg dark:border-zinc-700 p-8 text-center bg-white dark:bg-zinc-900">
          <p className="text-gray-500">No projects found. Create a project to get started.</p>
        </div>
      </div>
    )
  }

  // Determine date range
  const dates = allTasks.flatMap(t => [
      new Date(t.startDate),
      new Date(t.endDate),
      ...t.milestones.map(m => new Date(m.date))
  ])

  const minDate = dates.length > 0 ? startOfDay(min(dates)) : startOfDay(new Date())
  const maxDate = dates.length > 0 ? startOfDay(max(dates)) : addDays(startOfDay(new Date()), 7)

  // Add some buffer
  const viewStartDate = addDays(minDate, -5)
  const viewEndDate = addDays(maxDate, 10)
  const totalDays = differenceInDays(viewEndDate, viewStartDate) + 1

  const days = Array.from({ length: totalDays }, (_, i) => addDays(viewStartDate, i))
  const gridTemplateColumns = `${SIDEBAR_WIDTH}px repeat(${totalDays}, ${COLUMN_WIDTH}px)`

  const handleMouseDown = (e: React.MouseEvent, projectId: string, taskId?: string) => {
    // Check if clicking resize handle
    if ((e.target as HTMLElement).getAttribute('data-handle')) return

    // Only left click
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
    if (taskId) {
        setClickedTaskId(taskId)
    } else {
        setClickedTaskId(null)
    }
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

      if (dragStart && dragEnd && dragStart.getTime() === dragEnd.getTime()) {
          // Single click -> Milestone
          setIsMilestoneModalOpen(true)
      } else if (dragStart && dragEnd && dragStart.getTime() !== dragEnd.getTime()) {
          // Drag -> Task
          setIsTaskModalOpen(true)
      }

    } else if (resizingTask && resizeEdge && resizeCurrentDate && resizeProjectId) {
      const data = resizeEdge === 'start' ? { startDate: resizeCurrentDate } : { endDate: resizeCurrentDate };
      await updateTask(resizingTask, resizeProjectId, data);
      setResizingTask(null)
      setResizeEdge(null)
      setResizeCurrentDate(null)
      setResizeProjectId(null)
    }
  }

  // Helper to find filtered tasks for the modal if a project is selected
  const getTasksForModal = () => {
      if (dragProjectId) {
          const project = projects.find(p => p.id === dragProjectId)
          return project ? project.tasks : []
      }
      return projects.flatMap(p => p.tasks)
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Global Timeline</h2>

      <TaskCreationModal
        isOpen={isTaskModalOpen}
        onClose={() => {
            setIsTaskModalOpen(false);
            setDragStart(null);
            setDragEnd(null);
            setDragProjectId(null);
        }}
        initialStartDate={dragStart && dragEnd ? (dragStart < dragEnd ? dragStart : dragEnd) : undefined}
        initialEndDate={dragStart && dragEnd ? (dragStart < dragEnd ? dragEnd : dragStart) : undefined}
        projectId={dragProjectId || ''}
        projects={projects}
      />

      <MilestoneCreationModal
        isOpen={isMilestoneModalOpen}
        onClose={() => {
            setIsMilestoneModalOpen(false);
            setDragStart(null);
            setDragEnd(null);
            setDragProjectId(null);
            setClickedTaskId(null);
        }}
        initialDate={dragStart || undefined}
        taskId={clickedTaskId}
        tasks={getTasksForModal()}
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
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                backgroundColor: (project as any).color || '#3b82f6',
                                gridColumnStart: differenceInDays(dragStart < dragEnd ? dragStart : dragEnd, viewStartDate) + 2,
                                gridColumnEnd: `span ${differenceInDays(dragStart < dragEnd ? dragEnd : dragStart, dragStart < dragEnd ? dragStart : dragEnd) + 1}`
                            }}
                        >
                            {dragStart.getTime() !== dragEnd.getTime() ? "New Task" : "New Milestone"}
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
                        onMouseDown={(e) => handleMouseDown(e, project.id, task.id)}
                      >
                        <div className="p-2 pl-6 truncate text-sm border-r dark:border-zinc-700 bg-white dark:bg-zinc-900 sticky left-0 z-10 w-[200px] h-full flex items-center">
                          {task.name}
                        </div>

                        <div
                          className="rounded-md shadow-sm h-6 mx-1 flex items-center justify-center text-[10px] text-white whitespace-nowrap px-2 z-0 relative group/task"
                          style={{
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            backgroundColor: (project as any).color || '#3b82f6',
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

                         {/* Milestones */}
                         {task.milestones.map(milestone => {
                            const milestoneDate = startOfDay(new Date(milestone.date))
                            const offset = differenceInDays(milestoneDate, viewStartDate) + 2

                            if (offset < 2 || offset > totalDays + 1) return null

                            return (
                                <div
                                    key={milestone.id}
                                    className="flex items-center justify-center z-20 pointer-events-auto absolute top-1/2 mt-[2px] w-5 h-5"
                                    style={{
                                        gridColumnStart: offset,
                                        gridColumnEnd: 'span 1',
                                        justifySelf: 'center',
                                    }}
                                >
                                    <svg viewBox="0 0 16 16" className="w-5 h-5 overflow-visible drop-shadow-sm">
                                        {renderShape(milestone.shape)}
                                    </svg>
                                    <span className="absolute left-full ml-1 text-[10px] leading-none font-medium bg-white/90 dark:bg-zinc-900/90 px-1 py-0.5 rounded shadow-sm whitespace-nowrap border dark:border-zinc-700">
                                        {milestone.name}
                                    </span>
                                </div>
                            )
                          })}
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

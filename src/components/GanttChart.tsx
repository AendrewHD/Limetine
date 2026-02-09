'use client'

import { format, differenceInDays, addDays, startOfDay, min, max, subDays, isSameDay } from 'date-fns'
import { Task, Milestone, Project } from '@prisma/client'
import { useState, useRef, useLayoutEffect } from 'react'
import { updateTask } from '@/app/actions'
import TaskCreationModal from './TaskCreationModal'
import MilestoneCreationModal from './MilestoneCreationModal'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

type TaskWithMilestones = Task & {
  milestones: Milestone[]
}

interface GanttChartProps {
  tasks: TaskWithMilestones[]
  project: Project
}

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

export default function GanttChart({ tasks, project }: GanttChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // -- View State --
  const [viewMode, setViewMode] = useState<'Week' | 'Month' | '3-Month' | 'Year'>('Month')

  // Calculate column width based on view mode
  const getColumnWidth = (mode: string) => {
      switch(mode) {
          case 'Week': return 100;
          case 'Month': return 50;
          case '3-Month': return 30;
          case 'Year': return 20;
          default: return 50;
      }
  }
  const COLUMN_WIDTH = getColumnWidth(viewMode)

  // Initialize dates with a buffer around tasks or today
  const [viewStartDate, setViewStartDate] = useState<Date>(() => {
      const dates = tasks.flatMap(t => [new Date(t.startDate), new Date(t.endDate), ...t.milestones.map(m => new Date(m.date))])
      const minDate = dates.length > 0 ? min(dates) : new Date()
      return startOfDay(addDays(minDate, -15))
  })
  const [viewEndDate, setViewEndDate] = useState<Date>(() => {
      const dates = tasks.flatMap(t => [new Date(t.startDate), new Date(t.endDate), ...t.milestones.map(m => new Date(m.date))])
      const maxDate = dates.length > 0 ? max(dates) : addDays(new Date(), 7)
      return startOfDay(addDays(maxDate, 15))
  })

  const totalDays = differenceInDays(viewEndDate, viewStartDate) + 1
  const days = Array.from({ length: totalDays }, (_, i) => addDays(viewStartDate, i))
  const gridTemplateColumns = `${SIDEBAR_WIDTH}px repeat(${totalDays}, ${COLUMN_WIDTH}px)`

  // -- Interaction State --
  const [isDragging, setIsDragging] = useState(false) // Creating task
  const [dragStart, setDragStart] = useState<Date | null>(null)
  const [dragEnd, setDragEnd] = useState<Date | null>(null)

  const [isPanning, setIsPanning] = useState(false)
  const [panStartX, setPanStartX] = useState(0)
  const [panScrollLeft, setPanScrollLeft] = useState(0)

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false)
  const [clickedTaskId, setClickedTaskId] = useState<string | null>(null)

  const [resizingTask, setResizingTask] = useState<string | null>(null)
  const [resizeEdge, setResizeEdge] = useState<'start' | 'end' | null>(null)
  const [resizeCurrentDate, setResizeCurrentDate] = useState<Date | null>(null)

  // -- Infinite Scroll & Logic --

  // Adjust scroll position when viewStartDate changes (adding days to left)
  const prevStartRef = useRef(viewStartDate)
  useLayoutEffect(() => {
      if (prevStartRef.current > viewStartDate && containerRef.current) {
          const addedDays = differenceInDays(prevStartRef.current, viewStartDate)
          containerRef.current.scrollLeft += addedDays * COLUMN_WIDTH
      }
      prevStartRef.current = viewStartDate
  }, [viewStartDate, COLUMN_WIDTH])

  const jumpToToday = () => {
      if (!containerRef.current) return
      const today = startOfDay(new Date())

      // If today is outside range, center range on today
      if (today < viewStartDate || today > viewEndDate) {
          setViewStartDate(addDays(today, -15))
          setViewEndDate(addDays(today, 15))
          // Scroll will happen after render, logic below might be needed or effect will handle
          // Actually, if we reset dates completely, we might want to wait for render.
          // For simplicity, let's just update range.
          // But to jump specifically, we need to calculate offset.
          // Let's reset range to be safe.
          return;
      }

      const daysDiff = differenceInDays(today, viewStartDate)
      const scrollPos = daysDiff * COLUMN_WIDTH
      containerRef.current.scrollTo({ left: scrollPos, behavior: 'smooth' })
  }

  const handleMouseDown = (e: React.MouseEvent, taskId?: string) => {
    // Check if clicking resize handle
    if ((e.target as HTMLElement).getAttribute('data-handle')) return

    // Only left click
    if (e.button !== 0) return;
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect()
    const scrollLeft = containerRef.current.scrollLeft
    const x = e.clientX - rect.left + scrollLeft - SIDEBAR_WIDTH

    if (x < 0) return // Clicked in sidebar

    // LOGIC:
    // If Task clicked -> Drag to create logic? No, task click usually does nothing unless resize handle.
    // Actually, dragging ON a task currently does nothing in old code unless creating milestone.
    // Let's keep existing logic: clicking on task initiates potential creation (maybe milestone).
    // BUT we want Pan to be default on background.

    // Check if User wants to Create (Ctrl key or Shift key)
    // Or if they clicked on a task (taskId provided) - if on task, we probably don't want to pan,
    // we might want to move it (not implemented yet) or create milestone (existing).
    // Current "Create Task" logic is: Drag on background.

    const isCreateMode = e.ctrlKey || e.metaKey || e.shiftKey;

    if (taskId) {
         // Clicked on a task
         // Proceed with old logic (Drag to create milestone or just click)
         const dayIndex = Math.floor(x / COLUMN_WIDTH)
         const date = addDays(viewStartDate, dayIndex)
         setIsDragging(true)
         setDragStart(date)
         setDragEnd(date)
         setClickedTaskId(taskId)
    } else {
        // Clicked on background
        if (isCreateMode) {
             // Create Task
             const dayIndex = Math.floor(x / COLUMN_WIDTH)
             const date = addDays(viewStartDate, dayIndex)
             setIsDragging(true)
             setDragStart(date)
             setDragEnd(date)
             setClickedTaskId(null)
        } else {
             // Pan
             setIsPanning(true)
             setPanStartX(e.clientX)
             setPanScrollLeft(containerRef.current.scrollLeft)
        }
    }
  }

  const handleResizeStart = (e: React.MouseEvent, taskId: string, edge: 'start' | 'end', initialDate: Date) => {
    e.stopPropagation()
    e.preventDefault()
    setResizingTask(taskId)
    setResizeEdge(edge)
    setResizeCurrentDate(startOfDay(initialDate))
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return

    if (isPanning) {
        const dx = e.clientX - panStartX
        containerRef.current.scrollLeft = panScrollLeft - dx

        // Infinite Scroll Logic
        if (containerRef.current.scrollLeft < 500) {
            setViewStartDate(prev => subDays(prev, 10))
            setPanScrollLeft(prev => prev + (10 * COLUMN_WIDTH)) // Adjust stored start to avoid jump
             // We also need to adjust actual scrollLeft?
             // The useLayoutEffect handles the visual jump on render,
             // but here we are in the middle of a drag.
             // If we update state, render happens.
        }
        if (containerRef.current.scrollWidth - (containerRef.current.scrollLeft + containerRef.current.clientWidth) < 500) {
            setViewEndDate(prev => addDays(prev, 10))
        }
        return
    }

    if ((!isDragging && !resizingTask)) return

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
    if (isPanning) {
        setIsPanning(false)
        return
    }

    if (isDragging) {
      setIsDragging(false)

      if (dragStart && dragEnd && isSameDay(dragStart, dragEnd)) {
          // Single click -> Milestone
          setIsMilestoneModalOpen(true)
      } else if (dragStart && dragEnd && !isSameDay(dragStart, dragEnd)) {
          // Drag -> Task
          setIsTaskModalOpen(true)
      }

    } else if (resizingTask && resizeEdge && resizeCurrentDate) {
      const data = resizeEdge === 'start' ? { startDate: resizeCurrentDate } : { endDate: resizeCurrentDate };
      await updateTask(resizingTask, project.id, data);
      setResizingTask(null)
      setResizeEdge(null)
      setResizeCurrentDate(null)
    }
  }

    const handleExportPDF = async () => {
      if (!containerRef.current) return

      const options = {
          scrollX: -window.scrollX,
          scrollY: -window.scrollY,
          windowWidth: document.documentElement.offsetWidth,
          windowHeight: document.documentElement.offsetHeight
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const canvas = await html2canvas(containerRef.current, options as any)

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'px',
          format: [canvas.width, canvas.height]
      })
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)
      pdf.save('gantt-chart.pdf')
  }

  const projectColor = (project as { color?: string }).color || '#3b82f6';

  return (
    <div className="space-y-4">
       {/* Toolbar */}
       <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white dark:bg-zinc-900 border rounded-lg dark:border-zinc-700">
          <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-500">Zoom:</span>
              {(['Week', 'Month', '3-Month', 'Year'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-3 py-1 text-xs rounded-md border transition-colors ${viewMode === mode ? 'bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600 font-semibold' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50 border-transparent'}`}
                  >
                      {mode}
                  </button>
              ))}
          </div>

          <div className="flex items-center gap-2">
              <button
                onClick={jumpToToday}
                className="px-3 py-1 text-xs font-medium bg-zinc-100 dark:bg-zinc-800 rounded-md border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              >
                  Today
              </button>
              <button
                onClick={handleExportPDF}
                 className="px-3 py-1 text-xs font-medium bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-md border border-blue-100 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50"
              >
                  Export PDF
              </button>
          </div>
       </div>

       <TaskCreationModal
        isOpen={isTaskModalOpen}
        onClose={() => {
            setIsTaskModalOpen(false);
            setDragStart(null);
            setDragEnd(null);
        }}
        initialStartDate={dragStart && dragEnd ? (dragStart < dragEnd ? dragStart : dragEnd) : undefined}
        initialEndDate={dragStart && dragEnd ? (dragStart < dragEnd ? dragEnd : dragStart) : undefined}
        projectId={project.id}
        projects={[project]}
      />

      <MilestoneCreationModal
        isOpen={isMilestoneModalOpen}
        onClose={() => {
            setIsMilestoneModalOpen(false);
            setDragStart(null);
            setDragEnd(null);
            setClickedTaskId(null);
        }}
        initialDate={dragStart || undefined}
        taskId={clickedTaskId}
        tasks={tasks}
      />

      <div
        ref={containerRef}
        className="overflow-x-auto border rounded-lg dark:border-zinc-700 bg-white dark:bg-zinc-900 select-none scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', cursor: isPanning ? 'grabbing' : 'default' }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => { if(isDragging || resizingTask || isPanning) handleMouseUp() }}
      >
        <div className="min-w-full inline-block">
          {/* Header */}
          <div className="grid border-b dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 sticky top-0 z-30" style={{ gridTemplateColumns }}>
            <div className="p-2 font-bold border-r dark:border-zinc-700 sticky left-0 bg-gray-50 dark:bg-zinc-800 z-20">Task</div>
            {days.map(day => (
              <div key={day.toISOString()} className="p-2 text-center text-xs border-r border-gray-100 dark:border-zinc-700 last:border-r-0" style={{ width: COLUMN_WIDTH }}>
                <div className="font-semibold" suppressHydrationWarning>{format(day, 'd')}</div>
                <div className="text-gray-500" suppressHydrationWarning>{format(day, 'MMM')}</div>
              </div>
            ))}
          </div>

          {/* Rows */}
          <div className="relative">
             {/* Grid background lines */}
            <div className="absolute inset-0 grid pointer-events-none" style={{ gridTemplateColumns }}>
                <div className="border-r dark:border-zinc-700 bg-white dark:bg-zinc-900 sticky left-0 z-10"></div>
                {days.map(day => (
                    <div key={day.toISOString()} className="border-r border-dashed border-gray-100 dark:border-zinc-800 last:border-r-0"></div>
                ))}
            </div>

             {/* Drag Area / Ghost Task Row if dragging */}
            <div
                className="grid items-center relative h-10 bg-gray-50/50 dark:bg-zinc-800/30 group border-b dark:border-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-800/50"
                style={{ gridTemplateColumns, cursor: isPanning ? 'grabbing' : 'grab' }}
                onMouseDown={(e) => handleMouseDown(e)}
            >
                 <div className="p-2 font-semibold text-sm border-r dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 sticky left-0 z-10 w-[200px] h-full flex items-center truncate text-gray-400 italic pointer-events-none">
                    {isPanning ? "Panning..." : "Ctrl + Drag to create"}
                 </div>

                 {isDragging && dragStart && dragEnd && (
                    <div
                        className="rounded-md h-6 mx-1 flex items-center justify-center text-[10px] text-white whitespace-nowrap px-2 z-0 relative opacity-50 pointer-events-none"
                        style={{
                            backgroundColor: projectColor,
                            gridColumnStart: differenceInDays(dragStart < dragEnd ? dragStart : dragEnd, viewStartDate) + 2,
                            gridColumnEnd: `span ${differenceInDays(dragStart < dragEnd ? dragEnd : dragStart, dragStart < dragEnd ? dragStart : dragEnd) + 1}`
                        }}
                    >
                        {differenceInDays(dragEnd, dragStart) === 0 ? "New Milestone" : "New Task"}
                    </div>
                 )}
            </div>

            {tasks.map(task => {
              let taskStart = startOfDay(new Date(task.startDate))
              let taskEnd = startOfDay(new Date(task.endDate))

               // Apply resize override if applicable
                if (resizingTask === task.id && resizeCurrentDate) {
                    if (resizeEdge === 'start') taskStart = resizeCurrentDate
                    if (resizeEdge === 'end') taskEnd = resizeCurrentDate
                }

              const effectiveStart = taskStart < taskEnd ? taskStart : taskEnd
              const effectiveEnd = taskStart < taskEnd ? taskEnd : taskStart

              // Skip rendering if task is outside view
              if (effectiveEnd < viewStartDate || effectiveStart > viewEndDate) return null

              const startOffset = differenceInDays(effectiveStart, viewStartDate) + 2 // +1 for name col, +1 for 1-based index
              const duration = differenceInDays(effectiveEnd, effectiveStart) + 1 // Inclusive

              return (
                <div
                    key={task.id}
                    className="grid items-center relative h-12 hover:bg-gray-50 dark:hover:bg-zinc-800/50"
                    style={{ gridTemplateColumns }}
                    onMouseDown={(e) => handleMouseDown(e, task.id)}
                >
                  <div className="p-2 truncate font-medium border-r dark:border-zinc-700 bg-white dark:bg-zinc-900 sticky left-0 z-10 w-[200px] h-full flex items-center">
                    {task.name}
                  </div>

                  {/* Task Bar */}
                  <div
                    className="rounded-md shadow-sm h-8 mx-1 flex items-center justify-center text-xs text-white whitespace-nowrap px-2 z-0 relative group cursor-default"
                    style={{
                      backgroundColor: projectColor,
                      gridColumnStart: startOffset,
                      gridColumnEnd: `span ${duration}`
                    }}
                  >
                     {/* Resize Handles - VISIBLE INDICATORS */}
                    <div
                        className="absolute left-0 top-1 bottom-1 w-2 cursor-w-resize z-20 hover:bg-black/20 bg-white/30 rounded-full flex items-center justify-center transition-colors"
                        data-handle="true"
                        onMouseDown={(e) => handleResizeStart(e, task.id, 'start', effectiveStart)}
                    />
                    <div
                        className="absolute right-0 top-1 bottom-1 w-2 cursor-e-resize z-20 hover:bg-black/20 bg-white/30 rounded-full flex items-center justify-center transition-colors"
                        data-handle="true"
                        onMouseDown={(e) => handleResizeStart(e, task.id, 'end', effectiveEnd)}
                    />

                     {duration > 1 && <span className="truncate pointer-events-none">{task.name}</span>}
                  </div>

                  {/* Milestones */}
                  {task.milestones.map(milestone => {
                    const milestoneDate = startOfDay(new Date(milestone.date))

                    if (milestoneDate < viewStartDate || milestoneDate > viewEndDate) return null

                    const offset = differenceInDays(milestoneDate, viewStartDate) + 2

                    if (offset < 2 || offset > totalDays + 1) return null

                    return (
                        <div
                            key={milestone.id}
                            className="flex items-center justify-center z-20 pointer-events-auto absolute top-1/2 mt-[6px] w-5 h-5"
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
        </div>
      </div>
    </div>
  )
}

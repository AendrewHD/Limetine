import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Project, Task } from '@prisma/client'
import { format, min, max, differenceInDays, addDays, startOfDay } from 'date-fns'

type ProjectWithTasks = Project & { tasks: Task[] }

const ROW_HEIGHT = 10
const MARGIN_LEFT = 14
const NAME_COL_WIDTH = 50
const TIMELINE_START_X = MARGIN_LEFT + NAME_COL_WIDTH + 5 // 5mm padding

const drawGanttChart = (doc: jsPDF, tasks: Task[], startY: number): number => {
    if (tasks.length === 0) return startY;

    const dates = tasks.flatMap(t => [new Date(t.startDate), new Date(t.endDate)])
    const minDate = startOfDay(min(dates))
    const maxDate = startOfDay(max(dates))

    // Add buffer
    const viewStartDate = addDays(minDate, -1)
    const viewEndDate = addDays(maxDate, 2)
    const totalDays = differenceInDays(viewEndDate, viewStartDate)

    const pageWidth = doc.internal.pageSize.getWidth()
    const timelineWidth = pageWidth - TIMELINE_START_X - MARGIN_LEFT
    const dayWidth = timelineWidth / totalDays

    let currentY = startY

    // Draw Header (Timeline axis)
    doc.setFontSize(10)
    doc.setTextColor(100)

    // Draw simple axis: Start, Middle, End dates
    doc.text(format(viewStartDate, 'MMM d'), TIMELINE_START_X, currentY)
    doc.text(format(viewEndDate, 'MMM d'), TIMELINE_START_X + timelineWidth - 10, currentY)

    // Draw some grid lines or ticks? Keeping it simple for now due to PDF limitations
    // Maybe draw a line across
    doc.setDrawColor(200)
    doc.line(TIMELINE_START_X, currentY + 2, TIMELINE_START_X + timelineWidth, currentY + 2)

    currentY += 5

    doc.setFontSize(10)
    doc.setTextColor(0)

    tasks.forEach((task) => {
        // Check for page break
        if (currentY > doc.internal.pageSize.getHeight() - 20) {
            doc.addPage()
            currentY = 20
        }

        const taskStart = startOfDay(new Date(task.startDate))
        const taskEnd = startOfDay(new Date(task.endDate))

        const startOffsetDays = differenceInDays(taskStart, viewStartDate)
        const durationDays = differenceInDays(taskEnd, taskStart) + 1

        const x = TIMELINE_START_X + (startOffsetDays * dayWidth)
        const width = durationDays * dayWidth

        // Draw Name
        doc.text(task.name, MARGIN_LEFT, currentY + 6) // +6 for vertical alignment

        // Draw Bar
        doc.setFillColor(37, 99, 235) // Blue-600
        doc.roundedRect(x, currentY, width, 6, 1, 1, 'F')

        currentY += ROW_HEIGHT
    })

    return currentY + 10 // Padding after chart
}

const drawGlobalGanttChart = (doc: jsPDF, projects: ProjectWithTasks[], startY: number): number => {
    const activeProjects = projects.filter(p => p.tasks.length > 0)
    if (activeProjects.length === 0) return startY;

    const allTasks = activeProjects.flatMap(p => p.tasks)
    const dates = allTasks.flatMap(t => [new Date(t.startDate), new Date(t.endDate)])
    const minDate = startOfDay(min(dates))
    const maxDate = startOfDay(max(dates))

    // Add buffer
    const viewStartDate = addDays(minDate, -1)
    const viewEndDate = addDays(maxDate, 2)
    const totalDays = differenceInDays(viewEndDate, viewStartDate)

    const pageWidth = doc.internal.pageSize.getWidth()
    const timelineWidth = pageWidth - TIMELINE_START_X - MARGIN_LEFT
    const dayWidth = timelineWidth / totalDays

    let currentY = startY

    // Draw Header
    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.text(format(viewStartDate, 'MMM d'), TIMELINE_START_X, currentY)
    doc.text(format(viewEndDate, 'MMM d'), TIMELINE_START_X + timelineWidth - 10, currentY)
    doc.setDrawColor(200)
    doc.line(TIMELINE_START_X, currentY + 2, TIMELINE_START_X + timelineWidth, currentY + 2)
    currentY += 5

    doc.setFontSize(10)
    doc.setTextColor(0)

    activeProjects.forEach(project => {
         // Check for page break
        if (currentY > doc.internal.pageSize.getHeight() - 20) {
            doc.addPage()
            currentY = 20
        }

        // Project Header
        doc.setFont('helvetica', 'bold')
        doc.text(project.name, MARGIN_LEFT, currentY + 6)
        doc.setFont('helvetica', 'normal')

        currentY += ROW_HEIGHT

        project.tasks.forEach(task => {
            if (currentY > doc.internal.pageSize.getHeight() - 20) {
                doc.addPage()
                currentY = 20
            }

            const taskStart = startOfDay(new Date(task.startDate))
            const taskEnd = startOfDay(new Date(task.endDate))

            const startOffsetDays = differenceInDays(taskStart, viewStartDate)
            const durationDays = differenceInDays(taskEnd, taskStart) + 1

            const x = TIMELINE_START_X + (startOffsetDays * dayWidth)
            const width = durationDays * dayWidth

            // Draw Task Name (Indented)
            doc.text(task.name, MARGIN_LEFT + 5, currentY + 6)

            // Draw Bar
            doc.setFillColor(37, 99, 235)
            doc.roundedRect(x, currentY, width, 6, 1, 1, 'F')

            currentY += ROW_HEIGHT
        })
    })

    return currentY + 10
}


export const generateProjectPDF = (project: ProjectWithTasks) => {
  const doc = new jsPDF({ orientation: 'landscape' })

  doc.setFontSize(18)
  doc.text(project.name, 14, 22)

  let currentY = 30
  if (project.description) {
      doc.setFontSize(11)
      doc.setTextColor(100)
      doc.text(project.description, 14, 28)
      currentY = 35
  }

  // Draw Gantt Chart
  currentY = drawGanttChart(doc, project.tasks, currentY)

  // Draw Table
  const tableColumn = ["Task", "Status", "Start Date", "End Date", "Description"]
  const tableRows = project.tasks.map(task => [
    task.name,
    task.status,
    format(new Date(task.startDate), 'MMM d, yyyy'),
    format(new Date(task.endDate), 'MMM d, yyyy'),
    task.description || ''
  ])

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: currentY,
    headStyles: { fillColor: [37, 99, 235] },
  })

  doc.save(`${project.name}_Timeline.pdf`)
}

export const generateGlobalPDF = (projects: ProjectWithTasks[]) => {
  const doc = new jsPDF({ orientation: 'landscape' })

  doc.setFontSize(18)
  doc.text("Global Timeline", 14, 22)

  const activeProjects = projects.filter(p => p.tasks.length > 0)

  if (activeProjects.length === 0) {
      doc.setFontSize(12)
      doc.text("No tasks found.", 14, 30)
      doc.save('Global_Timeline.pdf')
      return
  }

  let currentY = 30

  // Draw Global Gantt Chart
  currentY = drawGlobalGanttChart(doc, activeProjects, currentY)

  const tableColumn = ["Project", "Task", "Status", "Start Date", "End Date", "Description"]
  const tableRows: string[][] = []

  activeProjects.forEach(project => {
      project.tasks.forEach(task => {
          tableRows.push([
              project.name,
              task.name,
              task.status,
              format(new Date(task.startDate), 'MMM d, yyyy'),
              format(new Date(task.endDate), 'MMM d, yyyy'),
              task.description || ''
          ])
      })
  })

  autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: currentY,
      headStyles: { fillColor: [37, 99, 235] }, // Blue-600
      columnStyles: {
          0: { fontStyle: 'bold' } // Bold project name
      }
  })

  doc.save('Global_Timeline.pdf')
}

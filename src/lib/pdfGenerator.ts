import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Project, Task } from '@prisma/client'
import { format } from 'date-fns'

type ProjectWithTasks = Project & { tasks: Task[] }

export const generateProjectPDF = (project: ProjectWithTasks) => {
  const doc = new jsPDF()

  doc.setFontSize(18)
  doc.text(project.name, 14, 22)

  if (project.description) {
      doc.setFontSize(11)
      doc.setTextColor(100)
      doc.text(project.description, 14, 28)
  }

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
    startY: project.description ? 35 : 30,
    headStyles: { fillColor: [37, 99, 235] }, // Blue-600
  })

  doc.save(`${project.name}_Timeline.pdf`)
}

export const generateGlobalPDF = (projects: ProjectWithTasks[]) => {
  const doc = new jsPDF()

  doc.setFontSize(18)
  doc.text("Global Timeline", 14, 22)

  const activeProjects = projects.filter(p => p.tasks.length > 0)

  if (activeProjects.length === 0) {
      doc.setFontSize(12)
      doc.text("No tasks found.", 14, 30)
      doc.save('Global_Timeline.pdf')
      return
  }

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
      startY: 30,
      headStyles: { fillColor: [37, 99, 235] }, // Blue-600
      columnStyles: {
          0: { fontStyle: 'bold' } // Bold project name
      }
  })

  doc.save('Global_Timeline.pdf')
}

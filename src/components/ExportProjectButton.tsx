'use client'

import { Project, Task } from '@prisma/client'
import { generateProjectPDF } from '@/lib/pdfGenerator'

type ProjectWithTasks = Project & { tasks: Task[] }

export default function ExportProjectButton({ project }: { project: ProjectWithTasks }) {
  return (
    <button
      onClick={() => generateProjectPDF(project)}
      className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-zinc-800 dark:border-zinc-700 dark:text-gray-300 dark:hover:bg-zinc-700"
    >
      Export PDF
    </button>
  )
}

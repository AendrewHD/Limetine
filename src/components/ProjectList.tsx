import Link from 'next/link'
import { Project, Task } from '@prisma/client'

type ProjectSummary = Project & {
  tasks?: Task[];
  _count?: { tasks: number };
}

interface ProjectListProps {
  projects: ProjectSummary[]
}

export default function ProjectList({ projects }: ProjectListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => {
        const taskCount = project._count?.tasks ?? project.tasks?.length ?? 0
        return (
          <Link
            key={project.id}
            href={`/projects/${project.id}`}
            className="block p-6 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 dark:bg-zinc-800 dark:border-zinc-700 dark:hover:bg-zinc-700 transition"
          >
            <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              {project.name}
            </h5>
            <p className="font-normal text-gray-700 dark:text-gray-400">
              {project.description || 'No description'}
            </p>
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-500">
              {taskCount} tasks
            </p>
          </Link>
        )
      })}
    </div>
  )
}

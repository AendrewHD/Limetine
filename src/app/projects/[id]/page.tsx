import { getProject } from '@/app/actions'
import GanttChart from '@/components/GanttChart'
import NewTaskForm from '@/components/NewTaskForm'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getTimelineRange } from '@/lib/timeline-utils'

export default async function ProjectPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const project = await getProject(params.id)

  if (!project) {
    notFound()
  }

  const { viewStartDate, totalDays } = getTimelineRange(project.tasks)

  return (
    <main className="min-h-screen p-8 lg:p-12 dark:bg-zinc-950 dark:text-white">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center gap-4 mb-8">
            <Link href="/" className="text-blue-500 hover:underline">
                &larr; Back
            </Link>
        </div>

        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b dark:border-zinc-800">
          <div>
            <h1 className="text-3xl font-bold">{project.name}</h1>
            <p className="mt-2 text-gray-500 dark:text-gray-400">{project.description}</p>
          </div>
          <NewTaskForm projectId={project.id} />
        </header>

        <section className="space-y-4">
            <h2 className="text-xl font-semibold">Timeline</h2>
            <GanttChart
              project={project}
              initialStartDate={viewStartDate}
              totalDays={totalDays}
            />
        </section>
      </div>
    </main>
  )
}

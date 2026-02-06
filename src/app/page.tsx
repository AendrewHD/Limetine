import NewProjectForm from '@/components/NewProjectForm'
import ProjectList from '@/components/ProjectList'
import GlobalTimeline from '@/components/GlobalTimeline'
import { getProjects, getTimelineData } from '@/app/actions'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const [projects, timelineData] = await Promise.all([
    getProjects(),
    getTimelineData()
  ])

  return (
    <main className="min-h-screen p-8 lg:p-24 dark:bg-zinc-950 dark:text-white">
      <div className="max-w-6xl mx-auto space-y-12">
        <header className="flex items-center justify-between border-b pb-6 dark:border-zinc-800">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Limetine</h1>
            <p className="mt-2 text-gray-500 dark:text-gray-400">Project Timeline Manager</p>
          </div>
          <NewProjectForm />
        </header>

        <section>
          <GlobalTimeline projects={timelineData} />
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-6">Your Projects</h2>
          <ProjectList projects={projects} />
        </section>
      </div>
    </main>
  )
}

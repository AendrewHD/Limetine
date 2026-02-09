import ProjectDropdown from '@/components/ProjectDropdown'
import GlobalTimeline from '@/components/GlobalTimeline'
import { getTimelineData } from '@/app/actions'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const projects = await getTimelineData()

  return (
    <main className="min-h-screen p-8 dark:bg-zinc-950 dark:text-white">
      <div className="w-full px-4 space-y-8">
        <header className="flex items-center justify-between border-b pb-6 dark:border-zinc-800">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Limetine</h1>
            <p className="mt-2 text-gray-500 dark:text-gray-400">Project Timeline Manager</p>
          </div>
          <ProjectDropdown projects={projects} />
        </header>

        <section>
          <GlobalTimeline
            projects={projects} today={new Date()}
          />
        </section>
      </div>
    </main>
  )
}

import NewProjectForm from '@/components/NewProjectForm'
import ProjectList from '@/components/ProjectList'
import { getProjects } from '@/app/actions'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function ProjectsPage() {
  const projects = await getProjects()

  return (
    <main className="min-h-screen p-8 lg:p-24 dark:bg-zinc-950 dark:text-white">
      <div className="max-w-6xl mx-auto space-y-12">
        <header className="flex items-center justify-between border-b pb-6 dark:border-zinc-800">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Projects</h1>
            <p className="mt-2 text-gray-500 dark:text-gray-400">Manage your projects</p>
          </div>
          <div className="flex gap-4">
             <Link href="/" className="px-4 py-2 border rounded hover:bg-gray-100 dark:border-zinc-700 dark:hover:bg-zinc-800 transition">
                Back to Timeline
             </Link>
             <NewProjectForm />
          </div>
        </header>

        <section>
          <ProjectList projects={projects} />
        </section>
      </div>
    </main>
  )
}

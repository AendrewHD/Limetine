'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Project } from '@prisma/client'
import { createProject } from '@/app/actions'

interface ProjectDropdownProps {
  projects: Project[]
}

export default function ProjectDropdown({ projects }: ProjectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showNewProjectForm, setShowNewProjectForm] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setShowNewProjectForm(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => {
          setIsOpen(!isOpen)
          setShowNewProjectForm(false)
        }}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-zinc-900 dark:border-zinc-700 dark:hover:bg-zinc-800 transition"
      >
        <span>Projects</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-md shadow-lg z-50 dark:bg-zinc-900 dark:border-zinc-700">
           {showNewProjectForm ? (
             <div className="p-4">
               <div className="flex justify-between items-center mb-2">
                 <h3 className="text-sm font-semibold">New Project</h3>
                 <button
                   onClick={() => setShowNewProjectForm(false)}
                   className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                 >
                   ✕
                 </button>
               </div>
               <form
                 action={async (formData) => {
                   await createProject(formData)
                   setShowNewProjectForm(false)
                   setIsOpen(false)
                 }}
                 className="flex flex-col gap-3"
               >
                 <input
                   name="name"
                   placeholder="Project Name"
                   className="p-2 text-sm border rounded dark:bg-zinc-800 dark:border-zinc-600 w-full"
                   required
                   autoFocus
                 />
                 <textarea
                   name="description"
                   placeholder="Description (optional)"
                   className="p-2 text-sm border rounded dark:bg-zinc-800 dark:border-zinc-600 w-full resize-none h-20"
                 />
                 <button
                   type="submit"
                   className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition"
                 >
                   Create Project
                 </button>
               </form>
             </div>
           ) : (
             <div className="py-1">
               {projects.length > 0 ? (
                 projects.slice(0, 5).map((project) => (
                   <Link
                     key={project.id}
                     href={`/projects/${project.id}`}
                     className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-zinc-800"
                     onClick={() => setIsOpen(false)}
                   >
                     {project.name}
                   </Link>
                 ))
               ) : (
                 <div className="px-4 py-2 text-sm text-gray-500">No projects yet</div>
               )}

               <div className="border-t border-gray-100 dark:border-zinc-800 my-1"></div>

               <button
                 onClick={() => setShowNewProjectForm(true)}
                 className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-zinc-800 flex items-center gap-2"
               >
                 <span className="text-lg leading-none">+</span> Create New Project
               </button>

               <div className="border-t border-gray-100 dark:border-zinc-800 my-1"></div>

               <Link
                 href="/projects"
                 className="block px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-gray-50 dark:text-blue-400 dark:hover:bg-zinc-800"
                 onClick={() => setIsOpen(false)}
               >
                 View all projects
               </Link>
             </div>
           )}
        </div>
      )}
    </div>
  )
}

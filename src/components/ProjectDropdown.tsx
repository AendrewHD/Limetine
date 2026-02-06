'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Project } from '@prisma/client'

interface ProjectDropdownProps {
  projects: Project[]
}

export default function ProjectDropdown({ projects }: ProjectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
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
        <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-50 dark:bg-zinc-900 dark:border-zinc-700">
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

            <Link
              href="/projects"
              className="block px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-gray-50 dark:text-blue-400 dark:hover:bg-zinc-800"
              onClick={() => setIsOpen(false)}
            >
              View all projects
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { createProject } from '@/app/actions'
import { useState } from 'react'

export default function NewProjectForm() {
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      >
        Create New Project
      </button>
    )
  }

  return (
    <div className="p-6 border rounded-lg bg-gray-50 dark:bg-zinc-900 dark:border-zinc-700">
      <h3 className="text-lg font-semibold mb-4">New Project</h3>
      <form action={async (formData) => {
          const result = await createProject(formData)
          if (result && result.error) {
            setError(result.error)
          } else {
            setError(null)
            setIsOpen(false)
          }
        }} className="flex flex-col gap-4"
      >
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <input
          name="name"
          placeholder="Project Name"
          className="p-2 border rounded dark:bg-zinc-800 dark:border-zinc-600"
          required
        />
        <textarea
          name="description"
          placeholder="Description"
          className="p-2 border rounded dark:bg-zinc-800 dark:border-zinc-600"
        />
        <div className="flex gap-2">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Create
          </button>
          <button
            type="button"
            onClick={() => {
              setIsOpen(false)
              setError(null)
            }}
            className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400 dark:bg-zinc-700 dark:text-white"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

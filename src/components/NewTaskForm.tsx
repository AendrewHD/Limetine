'use client'

import { createTask } from '@/app/actions'
import { useState, useTransition } from 'react'

export default function NewTaskForm({ projectId }: { projectId: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      >
        Add Task
      </button>
    )
  }

  return (
    <div className="p-6 border rounded-lg bg-gray-50 dark:bg-zinc-900 dark:border-zinc-700">
      <h3 className="text-lg font-semibold mb-4">New Task</h3>
      <form onSubmit={(e) => {
          e.preventDefault()
          const formData = new FormData(e.currentTarget)
          startTransition(async () => {
             try {
                const result = await createTask(formData)
                if (result && result.error) {
                  setError(result.error)
                } else {
                  setError(null)
                  setIsOpen(false)
                }
             } catch (err) {
                 console.error("Failed to create task", err)
                 setError("An unexpected error occurred")
             }
          })
        }} className="flex flex-col gap-4"
      >
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <input type="hidden" name="projectId" value={projectId} />
        <input
          name="name"
          placeholder="Task Name"
          className="p-2 border rounded dark:bg-zinc-800 dark:border-zinc-600"
          required
          disabled={isPending}
        />
        <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-xs mb-1">Start Date</label>
                <input
                type="date"
                name="startDate"
                className="w-full p-2 border rounded dark:bg-zinc-800 dark:border-zinc-600"
                required
                disabled={isPending}
                />
            </div>
            <div>
                <label className="block text-xs mb-1">End Date</label>
                <input
                type="date"
                name="endDate"
                className="w-full p-2 border rounded dark:bg-zinc-800 dark:border-zinc-600"
                required
                disabled={isPending}
                />
            </div>
        </div>
        <select name="status" className="p-2 border rounded dark:bg-zinc-800 dark:border-zinc-600" disabled={isPending}>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="DONE">Done</option>
        </select>

        <div className="flex gap-2 mt-2">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            disabled={isPending}
          >
            {isPending ? 'Adding...' : 'Add Task'}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsOpen(false)
              setError(null)
            }}
            className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400 dark:bg-zinc-700 dark:text-white"
            disabled={isPending}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

'use client'

import { createTask } from '@/app/actions'
import { useState } from 'react'

type Status = {
  id: string
  label: string
  value: string
  color: string | null
}

export default function NewTaskForm({ projectId, statuses = [] }: { projectId: string, statuses?: Status[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      <form action={async (formData) => {
          const result = await createTask(formData)
          if (result && result.error) {
            setError(result.error)
          } else {
            setError(null)
            setIsOpen(false)
          }
        }} className="flex flex-col gap-4"
      >
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <input type="hidden" name="projectId" value={projectId} />
        <input
          name="name"
          placeholder="Task Name"
          className="p-2 border rounded dark:bg-zinc-800 dark:border-zinc-600"
          required
        />
        <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-xs mb-1">Start Date</label>
                <input
                type="date"
                name="startDate"
                className="w-full p-2 border rounded dark:bg-zinc-800 dark:border-zinc-600"
                required
                />
            </div>
            <div>
                <label className="block text-xs mb-1">End Date</label>
                <input
                type="date"
                name="endDate"
                className="w-full p-2 border rounded dark:bg-zinc-800 dark:border-zinc-600"
                required
                />
            </div>
        </div>
        <select name="status" className="p-2 border rounded dark:bg-zinc-800 dark:border-zinc-600">
            {statuses.length > 0 ? (
                statuses.map(status => (
                    <option key={status.id} value={status.value}>{status.label}</option>
                ))
            ) : (
                <option value="TODO">To Do</option>
            )}
        </select>

        <div className="flex gap-2 mt-2">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Add Task
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

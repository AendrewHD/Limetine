'use client'

import { createTask } from '@/app/actions/task'
import { useState, useActionState, useEffect } from 'react'

type ActionState = { error?: string; success?: boolean } | null

function TaskForm({ projectId, onCancel, onSuccess }: { projectId: string, onCancel: () => void, onSuccess: () => void }) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(createTask, null)

  useEffect(() => {
    if (state?.success) {
      onSuccess()
    }
  }, [state, onSuccess])

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state?.error && <div className="text-red-500 text-sm">{state.error}</div>}
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
          onClick={onCancel}
          className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400 dark:bg-zinc-700 dark:text-white"
          disabled={isPending}
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

export default function NewTaskForm({ projectId }: { projectId: string }) {
  const [isOpen, setIsOpen] = useState(false)

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
      <TaskForm projectId={projectId} onCancel={() => setIsOpen(false)} onSuccess={() => setIsOpen(false)} />
    </div>
  )
}

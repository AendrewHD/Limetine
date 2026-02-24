'use client'

import { createMilestone } from '@/app/actions'
import { format } from 'date-fns'
import { Task } from '@prisma/client'
import { useActionState, useEffect } from 'react'

type ActionState = { error?: string; success?: boolean } | null

interface MilestoneCreationModalProps {
  isOpen: boolean
  onClose: () => void
  initialDate?: Date
  taskId?: string | null
  tasks: Task[]
}

function MilestoneCreationForm({
  onClose,
  initialDate,
  taskId,
  tasks
}: Omit<MilestoneCreationModalProps, 'isOpen'>) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(createMilestone, null)

  useEffect(() => {
    if (state?.success) {
      onClose()
    }
  }, [state, onClose])

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state?.error && <div className="text-red-500 text-sm">{state.error}</div>}
      <div>
        <label className="block text-sm font-medium mb-1">Task</label>
        <select
          name="taskId"
          defaultValue={taskId || ''}
          className="w-full p-2 border rounded dark:bg-zinc-800 dark:border-zinc-600"
          required
          disabled={isPending}
        >
          <option value="" disabled>Select a task</option>
          {tasks.map(task => (
            <option key={task.id} value={task.id}>{task.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Milestone Name</label>
        <input
          name="name"
          placeholder="Enter milestone name"
          className="w-full p-2 border rounded dark:bg-zinc-800 dark:border-zinc-600"
          autoFocus
          required
          disabled={isPending}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Date</label>
        <input
          type="date"
          name="date"
          defaultValue={initialDate ? format(initialDate, 'yyyy-MM-dd') : ''}
          className="w-full p-2 border rounded dark:bg-zinc-800 dark:border-zinc-600"
          required
          disabled={isPending}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Shape</label>
        <select name="shape" className="w-full p-2 border rounded dark:bg-zinc-800 dark:border-zinc-600" disabled={isPending}>
          <option value="circle">Circle</option>
          <option value="square">Square</option>
          <option value="triangle">Triangle</option>
          <option value="diamond">Diamond</option>
          <option value="star">Star</option>
          <option value="flag">Flag</option>
        </select>
      </div>

      <div className="flex gap-2 mt-4 justify-end">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm bg-gray-200 text-black rounded hover:bg-gray-300 dark:bg-zinc-700 dark:text-white dark:hover:bg-zinc-600"
          disabled={isPending}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
          disabled={isPending}
        >
          {isPending ? 'Creating...' : 'Create Milestone'}
        </button>
      </div>
    </form>
  )
}

export default function MilestoneCreationModal(props: MilestoneCreationModalProps) {
  if (!props.isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg shadow-xl w-full max-w-md border dark:border-zinc-700">
        <h3 className="text-lg font-semibold mb-4">Create Milestone</h3>
        <MilestoneCreationForm {...props} />
      </div>
    </div>
  )
}

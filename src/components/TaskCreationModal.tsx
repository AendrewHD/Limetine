'use client'

import { createTask } from '@/app/actions'
import { format } from 'date-fns'

interface TaskCreationModalProps {
  isOpen: boolean
  onClose: () => void
  initialStartDate?: Date
  initialEndDate?: Date
  projectId: string
  projects?: { id: string, name: string }[]
}

export default function TaskCreationModal({ isOpen, onClose, initialStartDate, initialEndDate, projectId, projects }: TaskCreationModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg shadow-xl w-full max-w-md border dark:border-zinc-700">
        <h3 className="text-lg font-semibold mb-4">Create Task</h3>
        <form action={async (formData) => {
            await createTask(formData)
            onClose()
          }}
          className="flex flex-col gap-4"
        >
          {projects && projects.length > 1 ? (
             <div>
                <label className="block text-sm font-medium mb-1">Project</label>
                <select
                    name="projectId"
                    defaultValue={projectId}
                    className="w-full p-2 border rounded dark:bg-zinc-800 dark:border-zinc-600"
                >
                    {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>
             </div>
          ) : (
             <input type="hidden" name="projectId" value={projectId} />
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Task Name</label>
            <input
              name="name"
              placeholder="Enter task name"
              className="w-full p-2 border rounded dark:bg-zinc-800 dark:border-zinc-600"
              autoFocus
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-xs mb-1">Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  defaultValue={initialStartDate ? format(initialStartDate, 'yyyy-MM-dd') : ''}
                  className="w-full p-2 border rounded dark:bg-zinc-800 dark:border-zinc-600"
                  required
                />
            </div>
            <div>
                <label className="block text-xs mb-1">End Date</label>
                <input
                  type="date"
                  name="endDate"
                  defaultValue={initialEndDate ? format(initialEndDate, 'yyyy-MM-dd') : ''}
                  className="w-full p-2 border rounded dark:bg-zinc-800 dark:border-zinc-600"
                  required
                />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
             <select name="status" className="w-full p-2 border rounded dark:bg-zinc-800 dark:border-zinc-600">
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="DONE">Done</option>
            </select>
          </div>

          <div className="flex gap-2 mt-4 justify-end">
             <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm bg-gray-200 text-black rounded hover:bg-gray-300 dark:bg-zinc-700 dark:text-white dark:hover:bg-zinc-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

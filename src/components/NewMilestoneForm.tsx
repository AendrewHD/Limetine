'use client'

import { createMilestone } from '@/app/actions'
import { useState } from 'react'
import { Task } from '@prisma/client'

interface NewMilestoneFormProps {
  tasks: Task[]
}

export default function NewMilestoneForm({ tasks }: NewMilestoneFormProps) {
  const [isOpen, setIsOpen] = useState(false)

  if (tasks.length === 0) return null

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
      >
        Add Milestone
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg w-[400px] shadow-xl border dark:border-zinc-700">
        <h3 className="text-lg font-semibold mb-4">New Milestone</h3>
        <form action={async (formData) => {
            await createMilestone(formData)
            setIsOpen(false)
          }} className="flex flex-col gap-4"
        >
          <div>
            <label className="block text-xs mb-1">Task</label>
            <select name="taskId" className="w-full p-2 border rounded dark:bg-zinc-800 dark:border-zinc-600" required>
              {tasks.map(task => (
                <option key={task.id} value={task.id}>{task.name}</option>
              ))}
            </select>
          </div>

          <input
            name="name"
            placeholder="Milestone Name"
            className="p-2 border rounded dark:bg-zinc-800 dark:border-zinc-600"
            required
          />

          <div>
              <label className="block text-xs mb-1">Date</label>
              <input
              type="date"
              name="date"
              className="w-full p-2 border rounded dark:bg-zinc-800 dark:border-zinc-600"
              required
              />
          </div>

          <div>
             <label className="block text-xs mb-1">Shape</label>
             <select name="shape" className="w-full p-2 border rounded dark:bg-zinc-800 dark:border-zinc-600">
                <option value="circle">Circle</option>
                <option value="square">Square</option>
                <option value="triangle">Triangle</option>
                <option value="diamond">Diamond</option>
                <option value="star">Star</option>
                <option value="flag">Flag</option>
             </select>
          </div>

          <div className="flex gap-2 mt-2">
            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Add Milestone
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400 dark:bg-zinc-700 dark:text-white"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

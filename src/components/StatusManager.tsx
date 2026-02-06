'use client'

import { useState } from 'react'
import { addTaskStatus, deleteTaskStatus } from '@/app/actions'

type Status = {
  id: string
  label: string
  value: string
  color: string | null
}

export default function StatusManager({ statuses }: { statuses: Status[] }) {
  const [isOpen, setIsOpen] = useState(false)

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-zinc-100 text-zinc-900 rounded hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100"
      >
        Manage Statuses
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg w-full max-w-md shadow-xl border dark:border-zinc-800">
        <h2 className="text-xl font-bold mb-4">Manage Statuses</h2>

        <div className="space-y-2 mb-6 max-h-60 overflow-y-auto">
          {statuses.map((status) => (
            <div key={status.id} className="flex justify-between items-center p-2 bg-zinc-50 dark:bg-zinc-800 rounded">
              <div className="flex flex-col">
                <span className="font-medium">{status.label}</span>
                <span className="text-xs text-gray-500">{status.value}</span>
              </div>
              <button
                onClick={async () => await deleteTaskStatus(status.id)}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                Delete
              </button>
            </div>
          ))}
        </div>

        <form action={async (formData) => {
            await addTaskStatus(formData)
        }} className="flex flex-col gap-3 border-t pt-4 dark:border-zinc-700">
            <h3 className="text-sm font-semibold">Add New Status</h3>
            <div className="flex gap-2">
                <input
                    name="label"
                    placeholder="Label (e.g. Review)"
                    className="flex-1 p-2 border rounded text-sm dark:bg-zinc-800 dark:border-zinc-700"
                    required
                />
                <input
                    name="value"
                    placeholder="Value (e.g. REVIEW)"
                    className="flex-1 p-2 border rounded text-sm dark:bg-zinc-800 dark:border-zinc-700"
                    required
                />
            </div>
            <button type="submit" className="bg-blue-600 text-white p-2 rounded text-sm hover:bg-blue-700">Add</button>
        </form>

        <button
          onClick={() => setIsOpen(false)}
          className="mt-4 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 w-full text-center"
        >
          Close
        </button>
      </div>
    </div>
  )
}

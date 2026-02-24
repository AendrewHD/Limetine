'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createMilestone(prevState: unknown, formData: FormData) {
  const name = formData.get('name') as string
  const date = formData.get('date') as string
  const shape = formData.get('shape') as string || 'circle'
  const taskId = formData.get('taskId') as string

  if (!name || !date || !taskId) {
    return { error: 'Missing required fields' }
  }

  // We need to know the projectId to revalidate the path
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { projectId: true }
  })

  if (!task) return { error: 'Task not found' }

  await prisma.milestone.create({
    data: {
      name,
      date: new Date(date),
      shape,
      taskId
    }
  })

  revalidatePath(`/projects/${task.projectId}`)
  return { success: true }
}

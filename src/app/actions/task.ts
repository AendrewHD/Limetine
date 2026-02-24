'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

const MAX_NAME_LENGTH = 255
const MAX_DESCRIPTION_LENGTH = 5000

export async function createTask(prevState: unknown, formData: FormData) {
  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const startDate = formData.get('startDate') as string
  const endDate = formData.get('endDate') as string
  const projectId = formData.get('projectId') as string
  const status = formData.get('status') as string || 'TODO'

  if (!name || !startDate || !endDate || !projectId) {
    return { error: 'Missing required fields' }
  }
  if (name.length > MAX_NAME_LENGTH) {
    return { error: `Name must be less than ${MAX_NAME_LENGTH} characters` }
  }
  if (description && description.length > MAX_DESCRIPTION_LENGTH) {
    return { error: `Description must be less than ${MAX_DESCRIPTION_LENGTH} characters` }
  }

  await prisma.task.create({
    data: {
      name,
      description,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      projectId,
      status
    },
  })

  revalidatePath(`/projects/${projectId}`)
  revalidatePath('/')
  return { success: true }
}

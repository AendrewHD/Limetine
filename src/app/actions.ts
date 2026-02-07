'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getRandomColor } from '@/lib/colors'

const MAX_NAME_LENGTH = 255
const MAX_DESCRIPTION_LENGTH = 5000

export async function createProject(formData: FormData) {
  const name = formData.get('name') as string
  const description = formData.get('description') as string

  if (!name) return { error: 'Name is required' }
  if (name.length > MAX_NAME_LENGTH) {
    return { error: `Name must be less than ${MAX_NAME_LENGTH} characters` }
  }
  if (description && description.length > MAX_DESCRIPTION_LENGTH) {
    return { error: `Description must be less than ${MAX_DESCRIPTION_LENGTH} characters` }
  }

  const projects = await prisma.project.findMany({ select: { color: true } })
  const usedColors = projects.map(p => p.color).filter(Boolean) as string[]
  const color = getRandomColor(usedColors)

  await prisma.project.create({
    data: {
      name,
      description,
      color,
    },
  })

  revalidatePath('/projects')
  revalidatePath('/')
}

export async function getProjects() {
  return await prisma.project.findMany({
    orderBy: { createdAt: 'desc' },
    include: { tasks: true }
  })
}

export async function getProject(id: string) {
  return await prisma.project.findUnique({
    where: { id },
    include: { tasks: { orderBy: { startDate: 'asc' } } },
  })
}

export async function createTask(formData: FormData) {
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
}

export async function updateTask(id: string, projectId: string, data: { startDate?: Date; endDate?: Date; name?: string; status?: string }) {
  await prisma.task.update({
    where: { id },
    data,
  })
  revalidatePath(`/projects/${projectId}`)
  revalidatePath('/')
}

export async function deleteTask(id: string, projectId: string) {
  await prisma.task.delete({
    where: { id },
  })
  revalidatePath(`/projects/${projectId}`)
  revalidatePath('/')
}

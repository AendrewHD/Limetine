'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { cache } from 'react'
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

  // Workaround for type issue where Project type is missing color property despite schema update
  const projects = await prisma.project.findMany()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const usedColors = projects.map((p: any) => p.color).filter(Boolean) as string[]
  const color = getRandomColor(usedColors)

  await prisma.project.create({
    data: {
      name,
      description,
      color,
    } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
  })

  revalidatePath('/projects')
  revalidatePath('/')
}

export async function getTimelineData() {
  return await prisma.project.findMany({
    orderBy: { createdAt: 'desc' },
    include: { tasks: { include: { milestones: true } } }
  })
}

// Optimized for list view: fetches only task counts
export async function getProjects() {
  return await prisma.project.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { tasks: true } } }
  })
}

export const getProject = cache(async (id: string) => {
  return await prisma.project.findUnique({
    where: { id },
    include: {
      tasks: {
        orderBy: { startDate: 'asc' },
        include: { milestones: true }
      }
    },
  })
})

export async function createTask(formData: FormData) {
  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const startDateStr = formData.get('startDate') as string
  const endDateStr = formData.get('endDate') as string
  const projectId = formData.get('projectId') as string
  const status = formData.get('status') as string || 'TODO'

  if (!name || !startDateStr || !endDateStr || !projectId) {
    return { error: 'Missing required fields' }
  }
  if (name.length > MAX_NAME_LENGTH) {
    return { error: `Name must be less than ${MAX_NAME_LENGTH} characters` }
  }
  if (description && description.length > MAX_DESCRIPTION_LENGTH) {
    return { error: `Description must be less than ${MAX_DESCRIPTION_LENGTH} characters` }
  }

  const startDate = new Date(startDateStr)
  const endDate = new Date(endDateStr)

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return { error: 'Invalid date format' }
  }

  await prisma.task.create({
    data: {
      name,
      description,
      startDate,
      endDate,
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

export async function createMilestone(formData: FormData) {
  const name = formData.get('name') as string
  const dateStr = formData.get('date') as string
  const shape = formData.get('shape') as string || 'circle'
  const taskId = formData.get('taskId') as string

  if (!name || !dateStr || !taskId) {
    return { error: 'Missing required fields' }
  }

  const date = new Date(dateStr)
  if (isNaN(date.getTime())) {
    return { error: 'Invalid date format' }
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
      date,
      shape,
      taskId
    }
  })

  revalidatePath(`/projects/${task.projectId}`)
}

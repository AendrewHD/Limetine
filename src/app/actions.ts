'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

const MAX_NAME_LENGTH = 255
const MAX_DESCRIPTION_LENGTH = 5000
export async function getTaskStatuses() {
  const statuses = await prisma.taskStatus.findMany({ orderBy: { createdAt: 'asc' } })
  if (statuses.length === 0) {
    const defaults = [
      { value: 'TODO', label: 'To Do', color: '#e4e4e7' },
      { value: 'IN_PROGRESS', label: 'In Progress', color: '#3b82f6' },
      { value: 'DONE', label: 'Done', color: '#22c55e' },
    ]
    for (const s of defaults) {
      await prisma.taskStatus.create({ data: s })
    }
    return await prisma.taskStatus.findMany({ orderBy: { createdAt: 'asc' } })
  }
  return statuses
}

export async function addTaskStatus(formData: FormData) {
  const label = formData.get('label') as string
  const value = formData.get('value') as string

  if (!label || !value) return { error: 'Missing fields' }

  try {
    await prisma.taskStatus.create({
      data: { label, value }
    })
    revalidatePath('/')
    revalidatePath('/projects')
  } catch (e) {
    return { error: 'Status already exists' }
  }
}

export async function deleteTaskStatus(id: string) {
  await prisma.taskStatus.delete({ where: { id } })
  revalidatePath('/')
  revalidatePath('/projects')
}

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

  await prisma.project.create({
    data: {
      name,
      description,
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

  const rawStatus = formData.get('status') as string

  // Validate against DB
  const validStatus = await prisma.taskStatus.findUnique({
    where: { value: rawStatus }
  })

  // Default to TODO if not found, or first available
  let status = 'TODO'
  if (validStatus) {
    status = validStatus.value
  } else {
    // Ensure TODO exists or get first one
    const first = await prisma.taskStatus.findFirst()
    if (first) status = first.value
  }

  if (!name || !startDate || !endDate || !projectId) {
    return { error: 'Missing required fields' }
  }
  if (name.length > MAX_NAME_LENGTH) {
    return { error: `Name must be less than ${MAX_NAME_LENGTH} characters` }
  }
  if (description && description.length > MAX_DESCRIPTION_LENGTH) {
    return { error: `Description must be less than ${MAX_DESCRIPTION_LENGTH} characters` }
  }

  const start = new Date(startDate)
  const end = new Date(endDate)

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { error: 'Invalid date format' }
  }

  await prisma.task.create({
    data: {
      name,
      description,
      startDate: start,
      endDate: end,
      projectId,
      status
    },
  })

  revalidatePath(`/projects/${projectId}`)
}

export async function deleteTask(id: string, projectId: string) {
  await prisma.task.delete({
    where: { id },
  })
  revalidatePath(`/projects/${projectId}`)
}

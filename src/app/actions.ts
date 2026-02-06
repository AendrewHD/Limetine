'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createProject(formData: FormData) {
  const name = formData.get('name') as string
  const description = formData.get('description') as string

  if (!name) return { error: 'Name is required' }

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

  const VALID_STATUSES = ['TODO', 'IN_PROGRESS', 'DONE']
  const rawStatus = formData.get('status') as string
  const status = VALID_STATUSES.includes(rawStatus) ? rawStatus : 'TODO'

  if (!name || !startDate || !endDate || !projectId) {
    return { error: 'Missing required fields' }
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
}

export async function deleteTask(id: string, projectId: string) {
  await prisma.task.delete({
    where: { id },
  })
  revalidatePath(`/projects/${projectId}`)
}

'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { cache } from 'react'

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

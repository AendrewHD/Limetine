'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getRandomColor } from '@/lib/colors'

const MAX_NAME_LENGTH = 255
const MAX_DESCRIPTION_LENGTH = 5000

export async function createProject(prevState: unknown, formData: FormData) {
  const name = formData.get('name') as string
  const description = formData.get('description') as string

  if (!name) return { error: 'Name is required' }
  if (name.length > MAX_NAME_LENGTH) {
    return { error: `Name must be less than ${MAX_NAME_LENGTH} characters` }
  }
  if (description && description.length > MAX_DESCRIPTION_LENGTH) {
    return { error: `Description must be less than ${MAX_DESCRIPTION_LENGTH} characters` }
  }

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
  return { success: true }
}

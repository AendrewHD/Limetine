import { addDays, differenceInDays, max, min, startOfDay, startOfToday } from 'date-fns'
import type { Task } from '@prisma/client'

export function getTimelineRange(tasks: Task[]) {
  let minDate: Date, maxDate: Date
  if (tasks.length > 0) {
    const dates = tasks.flatMap(t => [new Date(t.startDate), new Date(t.endDate)])
    minDate = startOfDay(min(dates))
    maxDate = startOfDay(max(dates))
  } else {
    const today = startOfToday()
    minDate = addDays(today, -7)
    maxDate = addDays(today, 7)
  }

  const viewStartDate = addDays(minDate, -2)
  const viewEndDate = addDays(maxDate, 5)
  const totalDays = differenceInDays(viewEndDate, viewStartDate) + 1

  return { viewStartDate, totalDays }
}

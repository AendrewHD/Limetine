import { describe, it } from 'node:test'
import assert from 'node:assert'
import { getTimelineRange } from './timeline-utils.ts'
import { startOfToday, addDays } from 'date-fns'

// Mock minimal Task interface matching what getTimelineRange expects
interface MockTask {
  startDate: Date
  endDate: Date
}

describe('getTimelineRange', () => {
  it('should return a default range centered around today when task list is empty', () => {
    const tasks: MockTask[] = []
    // Cast to unknown first to avoid TS errors, then to the expected argument type
    const result = getTimelineRange(tasks as unknown as Parameters<typeof getTimelineRange>[0])

    const today = startOfToday()
    const expectedMinDate = addDays(today, -7)
    // const expectedMaxDate = addDays(today, 7)
    const expectedViewStartDate = addDays(expectedMinDate, -2)
    // const expectedViewEndDate = addDays(expectedMaxDate, 5)

    // totalDays calculation logic verified manually:
    // (today + 12) - (today - 9) = 21 days difference + 1 = 22 days total
    const expectedTotalDays = 22

    assert.deepStrictEqual(result.viewStartDate, expectedViewStartDate)
    assert.strictEqual(result.totalDays, expectedTotalDays)
  })

  it('should calculate range correctly for a single task', () => {
    const today = startOfToday()
    const task: MockTask = {
      startDate: today,
      endDate: addDays(today, 5)
    }
    const result = getTimelineRange([task] as unknown as Parameters<typeof getTimelineRange>[0])

    // minDate = today
    // maxDate = today + 5
    // viewStartDate = today - 2
    // viewEndDate = today + 10

    const expectedViewStartDate = addDays(today, -2)
    // totalDays = (today + 10) - (today - 2) + 1 = 12 + 1 = 13
    const expectedTotalDays = 13

    assert.deepStrictEqual(result.viewStartDate, expectedViewStartDate)
    assert.strictEqual(result.totalDays, expectedTotalDays)
  })

  it('should calculate range correctly for multiple tasks', () => {
    const today = startOfToday()
    const tasks: MockTask[] = [
      { startDate: today, endDate: addDays(today, 2) },
      { startDate: addDays(today, 5), endDate: addDays(today, 10) },
      { startDate: addDays(today, -5), endDate: addDays(today, -1) }
    ]
    const result = getTimelineRange(tasks as unknown as Parameters<typeof getTimelineRange>[0])

    // minDate = today - 5
    // maxDate = today + 10
    // viewStartDate = today - 7
    // viewEndDate = today + 15

    const expectedViewStartDate = addDays(addDays(today, -5), -2)
    // totalDays = (today + 15) - (today - 7) + 1 = 22 + 1 = 23
    const expectedTotalDays = 23

    assert.deepStrictEqual(result.viewStartDate, expectedViewStartDate)
    assert.strictEqual(result.totalDays, expectedTotalDays)
  })

  it('should handle tasks with same start and end date', () => {
    const today = startOfToday()
    const tasks: MockTask[] = [
        { startDate: today, endDate: today }
    ]
    const result = getTimelineRange(tasks as unknown as Parameters<typeof getTimelineRange>[0])

    // minDate = today
    // maxDate = today
    // viewStartDate = today - 2
    // viewEndDate = today + 5

    const expectedViewStartDate = addDays(today, -2)
    // totalDays = (today + 5) - (today - 2) + 1 = 7 + 1 = 8
    const expectedTotalDays = 8

    assert.deepStrictEqual(result.viewStartDate, expectedViewStartDate)
    assert.strictEqual(result.totalDays, expectedTotalDays)
  })
})

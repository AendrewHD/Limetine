/* eslint-disable */
const { format, differenceInDays, addDays, startOfDay, min, max } = require('date-fns');

// Mock data generator
function generateTasks(count) {
  const tasks = [];
  const baseDate = new Date();
  for (let i = 0; i < count; i++) {
    tasks.push({
      id: i,
      startDate: addDays(baseDate, Math.floor(Math.random() * 30)),
      endDate: addDays(baseDate, 30 + Math.floor(Math.random() * 30)),
      name: `Task ${i}`
    });
  }
  return tasks;
}

function calculate(tasks) {
  // Determine date range
  const dates = tasks.flatMap(t => [new Date(t.startDate), new Date(t.endDate)])
  if (dates.length === 0) return;
  const minDate = startOfDay(min(dates))
  const maxDate = startOfDay(max(dates))

  // Add some buffer
  const viewStartDate = addDays(minDate, -2)
  const viewEndDate = addDays(maxDate, 5)
  const totalDays = differenceInDays(viewEndDate, viewStartDate) + 1

  const days = Array.from({ length: totalDays }, (_, i) => addDays(viewStartDate, i))
  return days.length;
}

const taskCounts = [100, 1000, 5000];

console.log("Running benchmark...");

taskCounts.forEach(count => {
  const tasks = generateTasks(count);
  const start = process.hrtime();
  const iterations = 100; // Reduced iterations to keep it fast

  for(let i=0; i<iterations; i++) {
    calculate(tasks);
  }

  const end = process.hrtime(start);
  const timeInMs = (end[0] * 1000 + end[1] / 1e6);
  const avgTime = timeInMs / iterations;

  console.log(`Tasks: ${count}, Total time: ${timeInMs.toFixed(2)}ms, Avg per call: ${avgTime.toFixed(4)}ms`);
});

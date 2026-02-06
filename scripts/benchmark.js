const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // 1. Seed
  try {
    const projectCount = await prisma.project.count();
    if (projectCount < 10) {
      console.log('Seeding...');
      for (let i = 0; i < 20; i++) {
        const p = await prisma.project.create({
          data: {
            name: `Project ${i}`,
            description: 'Benchmark project',
          }
        });
        // Create 50 tasks for each project
        const tasks = [];
        for (let j = 0; j < 50; j++) {
           tasks.push({
            name: `Task ${j}`,
            description: 'Task desc',
            startDate: new Date(),
            endDate: new Date(),
            projectId: p.id
           });
        }
        // Use createMany if available, but sqlite might have limits or older prisma version?
        // createMany is supported in sqlite in recent versions.
        // But to be safe and simple:
        for (const t of tasks) {
           await prisma.task.create({ data: t });
        }
      }
      console.log('Seeded.');
    } else {
        console.log(`Database already has ${projectCount} projects. Skipping seed.`);
    }

    // 2. Measure Original
    const start1 = performance.now();
    const res1 = await prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
      include: { tasks: true }
    });
    const end1 = performance.now();
    const size1 = JSON.stringify(res1).length;

    console.log(`Original (include: { tasks: true }):`);
    console.log(`  Count: ${res1.length} projects`);
    console.log(`  Time: ${(end1 - start1).toFixed(2)}ms`);
    console.log(`  Payload: ${(size1 / 1024).toFixed(2)} KB`);

    // 3. Measure Optimized
    const start2 = performance.now();
    const res2 = await prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { tasks: true } } }
    });
    const end2 = performance.now();
    const size2 = JSON.stringify(res2).length;

    console.log(`Optimized (include: { _count: ... }):`);
    console.log(`  Count: ${res2.length} projects`);
    console.log(`  Time: ${(end2 - start2).toFixed(2)}ms`);
    console.log(`  Payload: ${(size2 / 1024).toFixed(2)} KB`);

  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();

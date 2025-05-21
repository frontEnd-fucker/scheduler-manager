import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Create a test user
  const user = await prisma.user.upsert({
    where: { id: 'user_123456789' },
    update: {},
    create: {
      id: 'user_123456789',
      email: 'test@example.com',
      name: 'Test User',
    },
  });

  console.log(`Created user: ${user.name} (${user.email})`);

  // Create a course table
  const courseTable = await prisma.courseTable.upsert({
    where: { id: 'table_123456789' },
    update: {},
    create: {
      id: 'table_123456789',
      name: '2023 Fall Semester',
      userId: user.id,
    },
  });

  console.log(`Created course table: ${courseTable.name}`);

  // Create time slots
  const timeSlots = [
    { start: new Date('2000-01-01T08:00:00'), end: new Date('2000-01-01T09:30:00'), order: 1 },
    { start: new Date('2000-01-01T09:30:00'), end: new Date('2000-01-01T11:00:00'), order: 2 },
    { start: new Date('2000-01-01T11:10:00'), end: new Date('2000-01-01T12:40:00'), order: 3 },
    { start: new Date('2000-01-01T12:40:00'), end: new Date('2000-01-01T14:10:00'), order: 4 },
    { start: new Date('2000-01-01T14:30:00'), end: new Date('2000-01-01T16:00:00'), order: 5 },
    { start: new Date('2000-01-01T16:10:00'), end: new Date('2000-01-01T17:40:00'), order: 6 },
  ];

  // Delete existing time slots for this table
  await prisma.timeSlot.deleteMany({
    where: {
      courseTableId: courseTable.id,
    },
  });

  // Create new time slots
  for (const slot of timeSlots) {
    await prisma.timeSlot.create({
      data: {
        ...slot,
        courseTableId: courseTable.id,
      },
    });
  }

  console.log(`Created ${timeSlots.length} time slots`);

  // Create course items
  const courseItems = [
    { courseName: '高等数学', isUsed: false },
    { courseName: '大学英语', isUsed: false },
    { courseName: '计算机基础', isUsed: false },
    { courseName: '物理学', isUsed: false },
    { courseName: '程序设计', isUsed: false },
  ];

  // Delete existing course items for this table
  await prisma.courseItem.deleteMany({
    where: {
      courseTableId: courseTable.id,
    },
  });

  // Create new course items
  for (const item of courseItems) {
    await prisma.courseItem.create({
      data: {
        ...item,
        courseTableId: courseTable.id,
      },
    });
  }

  console.log(`Created ${courseItems.length} course items`);

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 
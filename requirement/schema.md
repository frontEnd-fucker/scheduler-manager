// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql" // You can change this to sqlite, mysql, etc. based on your preference
  url      = env("DATABASE_URL")
}

// User model for authentication (optional, can be added later)
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  courses   Course[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// Course model based on the frontend implementation
model Course {
  id        String   @id @default(cuid())
  name      String
  dayOfWeek Int      // 1-5 representing Monday to Friday
  timeSlotId Int     // References the time slot
  startTime String?  // Optional as it can be derived from timeSlot
  endTime   String?  // Optional as it can be derived from timeSlot
  user      User?    @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId    String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
  @@index([dayOfWeek, timeSlotId]) // For efficient querying of courses by day and time slot
}

// TimeSlot model to store the available time slots
model TimeSlot {
  id      Int    @id @default(autoincrement())
  start   String // Format: "HH:MM"
  end     String // Format: "HH:MM"
  order   Int    // For sorting time slots in the correct order
  
  @@index([order]) // For efficient sorting
}

// CourseItem model for the draggable course items
model CourseItem {
  id         String  @id @default(cuid())
  courseName String  @unique
  isUsed     Boolean @default(false)
  user       User?   @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId     String?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@index([userId])
}
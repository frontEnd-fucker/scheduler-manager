"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Type definitions
export type CourseTableWithRelations = Awaited<ReturnType<typeof getCourseTable>>;

// Validation schemas
const CourseTableSchema = z.object({
  name: z.string().min(1, "Course table name is required"),
});

// Get all course tables for the current user
export async function getCourseTablesForUser(userId: string) {
  if (!userId) {
    throw new Error("User ID is required");
  }

  try {
    return await prisma.courseTable.findMany({
      where: { userId },
      include: {
        timeSlots: {
          orderBy: { order: "asc" },
        },
        courses: true,
        courseItems: true,
      },
    });
  } catch (error) {
    console.error("Failed to fetch course tables:", error);
    throw new Error("Failed to fetch course tables");
  }
}

// Get a specific course table with all relations
export async function getCourseTable(tableId: string, userId: string) {
  if (!tableId || !userId) {
    throw new Error("Table ID and User ID are required");
  }

  try {
    const courseTable = await prisma.courseTable.findUnique({
      where: {
        id: tableId,
        userId,
      },
      include: {
        timeSlots: {
          orderBy: { order: "asc" },
        },
        courses: true,
        courseItems: true,
      },
    });

    if (!courseTable) {
      throw new Error("Course table not found");
    }

    return courseTable;
  } catch (error) {
    console.error("Failed to fetch course table:", error);
    throw new Error("Failed to fetch course table");
  }
}

// Create a new course table
export async function createCourseTable(
  data: z.infer<typeof CourseTableSchema>,
  userId: string
) {
  if (!userId) {
    return { error: "User ID is required" };
  }

  try {
    const validation = CourseTableSchema.safeParse(data);
    if (!validation.success) {
      return { error: validation.error.format() };
    }

    // Create default time slots
    const defaultTimeSlots = [
      { start: new Date("2000-01-01T08:00:00"), end: new Date("2000-01-01T09:30:00"), order: 1 },
      { start: new Date("2000-01-01T09:30:00"), end: new Date("2000-01-01T11:00:00"), order: 2 },
      { start: new Date("2000-01-01T11:10:00"), end: new Date("2000-01-01T12:40:00"), order: 3 },
      { start: new Date("2000-01-01T12:40:00"), end: new Date("2000-01-01T14:10:00"), order: 4 },
      { start: new Date("2000-01-01T14:30:00"), end: new Date("2000-01-01T16:00:00"), order: 5 },
      { start: new Date("2000-01-01T16:10:00"), end: new Date("2000-01-01T17:40:00"), order: 6 },
    ];

    const courseTable = await prisma.courseTable.create({
      data: {
        name: validation.data.name,
        userId,
        timeSlots: {
          create: defaultTimeSlots,
        },
      },
      include: {
        timeSlots: true,
      },
    });

    revalidatePath("/");
    return { data: courseTable };
  } catch (error) {
    console.error("Failed to create course table:", error);
    return { error: "Failed to create course table" };
  }
}

// Update a course table
export async function updateCourseTable(
  tableId: string,
  data: z.infer<typeof CourseTableSchema>,
  userId: string
) {
  if (!tableId || !userId) {
    return { error: "Table ID and User ID are required" };
  }

  try {
    const validation = CourseTableSchema.safeParse(data);
    if (!validation.success) {
      return { error: validation.error.format() };
    }

    // Check if the course table exists and belongs to the user
    const existingTable = await prisma.courseTable.findUnique({
      where: {
        id: tableId,
        userId,
      },
    });

    if (!existingTable) {
      return { error: "Course table not found or access denied" };
    }

    const updatedCourseTable = await prisma.courseTable.update({
      where: {
        id: tableId,
      },
      data: validation.data,
    });

    revalidatePath("/");
    return { data: updatedCourseTable };
  } catch (error) {
    console.error("Failed to update course table:", error);
    return { error: "Failed to update course table" };
  }
}

// Delete a course table
export async function deleteCourseTable(tableId: string, userId: string) {
  if (!tableId || !userId) {
    return { error: "Table ID and User ID are required" };
  }

  try {
    // Check if the course table exists and belongs to the user
    const existingTable = await prisma.courseTable.findUnique({
      where: {
        id: tableId,
        userId,
      },
    });

    if (!existingTable) {
      return { error: "Course table not found or access denied" };
    }

    await prisma.courseTable.delete({
      where: {
        id: tableId,
      },
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete course table:", error);
    return { error: "Failed to delete course table" };
  }
} 
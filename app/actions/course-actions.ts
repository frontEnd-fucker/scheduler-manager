"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Validation schemas
const CourseSchema = z.object({
  name: z.string().min(1, "Course name is required"),
  dayOfWeek: z.number().min(1).max(5),
  timeSlotId: z.number().int().positive(),
});

const CourseUpdateSchema = z.object({
  name: z.string().min(1, "Course name is required").optional(),
  dayOfWeek: z.number().min(1).max(5).optional(),
  timeSlotId: z.number().int().positive().optional(),
});

// Get all courses for a specific course table
export async function getCoursesForTable(tableId: string, userId: string) {
  if (!tableId || !userId) {
    throw new Error("Table ID and User ID are required");
  }

  try {
    // Check if the course table exists and belongs to the user
    const courseTable = await prisma.courseTable.findUnique({
      where: {
        id: tableId,
        userId,
      },
    });

    if (!courseTable) {
      throw new Error("Course table not found or access denied");
    }

    return await prisma.course.findMany({
      where: {
        courseTableId: tableId,
      },
      include: {
        timeSlot: true,
      },
    });
  } catch (error) {
    console.error("Failed to fetch courses:", error);
    throw new Error("Failed to fetch courses");
  }
}

// Create a new course
export async function createCourse(
  tableId: string,
  data: z.infer<typeof CourseSchema>,
  userId: string
) {
  if (!tableId || !userId) {
    return { error: "Table ID and User ID are required" };
  }

  try {
    const validation = CourseSchema.safeParse(data);
    if (!validation.success) {
      return { error: validation.error.format() };
    }

    // Check if the course table exists and belongs to the user
    const courseTable = await prisma.courseTable.findUnique({
      where: {
        id: tableId,
        userId,
      },
    });

    if (!courseTable) {
      return { error: "Course table not found or access denied" };
    }

    // Check if the time slot exists in this course table
    const timeSlot = await prisma.timeSlot.findUnique({
      where: {
        id: validation.data.timeSlotId,
        courseTableId: tableId,
      },
    });

    if (!timeSlot) {
      return { error: "Time slot not found in this course table" };
    }

    // Check if there's already a course in this day and time slot
    const existingCourse = await prisma.course.findFirst({
      where: {
        courseTableId: tableId,
        dayOfWeek: validation.data.dayOfWeek,
        timeSlotId: validation.data.timeSlotId,
      },
    });

    if (existingCourse) {
      return { error: "A course already exists in this day and time slot" };
    }

    const course = await prisma.course.create({
      data: {
        name: validation.data.name,
        dayOfWeek: validation.data.dayOfWeek,
        timeSlotId: validation.data.timeSlotId,
        courseTableId: tableId,
      },
    });

    // Update the corresponding course item if it exists
    await prisma.courseItem.updateMany({
      where: {
        courseName: validation.data.name,
        courseTableId: tableId,
      },
      data: {
        isUsed: true,
      },
    });

    revalidatePath("/");
    return { data: course };
  } catch (error) {
    console.error("Failed to create course:", error);
    return { error: "Failed to create course" };
  }
}

// Update a course
export async function updateCourse(
  tableId: string,
  courseId: string,
  data: z.infer<typeof CourseUpdateSchema>,
  userId: string
) {
  if (!tableId || !courseId || !userId) {
    return { error: "Table ID, Course ID, and User ID are required" };
  }

  try {
    const validation = CourseUpdateSchema.safeParse(data);
    if (!validation.success) {
      return { error: validation.error.format() };
    }

    // Check if the course table exists and belongs to the user
    const courseTable = await prisma.courseTable.findUnique({
      where: {
        id: tableId,
        userId,
      },
    });

    if (!courseTable) {
      return { error: "Course table not found or access denied" };
    }

    // Check if the course exists and belongs to the course table
    const existingCourse = await prisma.course.findUnique({
      where: {
        id: courseId,
        courseTableId: tableId,
      },
    });

    if (!existingCourse) {
      return { error: "Course not found" };
    }

    // If changing time slot or day, check if it's available
    if (validation.data.dayOfWeek || validation.data.timeSlotId) {
      const newDayOfWeek = validation.data.dayOfWeek || existingCourse.dayOfWeek;
      const newTimeSlotId = validation.data.timeSlotId || existingCourse.timeSlotId;

      // Check if there's already a course in this day and time slot (excluding the current course)
      const conflictingCourse = await prisma.course.findFirst({
        where: {
          courseTableId: tableId,
          dayOfWeek: newDayOfWeek,
          timeSlotId: newTimeSlotId,
          id: { not: courseId },
        },
      });

      if (conflictingCourse) {
        return { error: "A course already exists in this day and time slot" };
      }
    }

    // If changing the name, update the isUsed flag for course items
    if (validation.data.name && validation.data.name !== existingCourse.name) {
      // Set the old course item to not used
      await prisma.courseItem.updateMany({
        where: {
          courseName: existingCourse.name,
          courseTableId: tableId,
        },
        data: {
          isUsed: false,
        },
      });

      // Set the new course item to used
      await prisma.courseItem.updateMany({
        where: {
          courseName: validation.data.name,
          courseTableId: tableId,
        },
        data: {
          isUsed: true,
        },
      });
    }

    const updatedCourse = await prisma.course.update({
      where: {
        id: courseId,
      },
      data: validation.data,
    });

    revalidatePath("/");
    return { data: updatedCourse };
  } catch (error) {
    console.error("Failed to update course:", error);
    return { error: "Failed to update course" };
  }
}

// Delete a course
export async function deleteCourse(
  tableId: string,
  courseId: string,
  userId: string
) {
  if (!tableId || !courseId || !userId) {
    return { error: "Table ID, Course ID, and User ID are required" };
  }

  try {
    // Check if the course table exists and belongs to the user
    const courseTable = await prisma.courseTable.findUnique({
      where: {
        id: tableId,
        userId,
      },
    });

    if (!courseTable) {
      return { error: "Course table not found or access denied" };
    }

    // Get the course to be deleted
    const course = await prisma.course.findUnique({
      where: {
        id: courseId,
        courseTableId: tableId,
      },
    });

    if (!course) {
      return { error: "Course not found" };
    }

    // Delete the course
    await prisma.course.delete({
      where: {
        id: courseId,
      },
    });

    // Update the course item to not used
    await prisma.courseItem.updateMany({
      where: {
        courseName: course.name,
        courseTableId: tableId,
      },
      data: {
        isUsed: false,
      },
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete course:", error);
    return { error: "Failed to delete course" };
  }
} 
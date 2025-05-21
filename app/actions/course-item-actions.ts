"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Validation schemas
const CourseItemSchema = z.object({
  courseName: z.string().min(1, "Course name is required"),
});

const CourseItemUpdateSchema = z.object({
  courseName: z.string().min(1, "Course name is required").optional(),
  isUsed: z.boolean().optional(),
});

// Get all course items for a specific course table
export async function getCourseItemsForTable(tableId: string, userId: string) {
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

    return await prisma.courseItem.findMany({
      where: {
        courseTableId: tableId,
      },
      orderBy: {
        createdAt: "asc",
      },
    });
  } catch (error) {
    console.error("Failed to fetch course items:", error);
    throw new Error("Failed to fetch course items");
  }
}

// Create a new course item
export async function createCourseItem(
  tableId: string,
  data: z.infer<typeof CourseItemSchema>,
  userId: string
) {
  if (!tableId || !userId) {
    return { error: "Table ID and User ID are required" };
  }

  try {
    const validation = CourseItemSchema.safeParse(data);
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

    // Check if a course item with this name already exists in this course table
    const existingCourseItem = await prisma.courseItem.findFirst({
      where: {
        courseName: validation.data.courseName,
        courseTableId: tableId,
      },
    });

    if (existingCourseItem) {
      return { error: "A course item with this name already exists" };
    }

    const courseItem = await prisma.courseItem.create({
      data: {
        courseName: validation.data.courseName,
        courseTableId: tableId,
        isUsed: false,
      },
    });

    revalidatePath("/");
    return { data: courseItem };
  } catch (error) {
    console.error("Failed to create course item:", error);
    return { error: "Failed to create course item" };
  }
}

// Update a course item
export async function updateCourseItem(
  tableId: string,
  itemId: string,
  data: z.infer<typeof CourseItemUpdateSchema>,
  userId: string
) {
  if (!tableId || !itemId || !userId) {
    return { error: "Table ID, Item ID, and User ID are required" };
  }

  try {
    const validation = CourseItemUpdateSchema.safeParse(data);
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

    // Check if the course item exists and belongs to the course table
    const existingCourseItem = await prisma.courseItem.findUnique({
      where: {
        id: itemId,
        courseTableId: tableId,
      },
    });

    if (!existingCourseItem) {
      return { error: "Course item not found" };
    }

    // If changing the name, check if it's unique
    if (validation.data.courseName && validation.data.courseName !== existingCourseItem.courseName) {
      const duplicateCourseItem = await prisma.courseItem.findFirst({
        where: {
          courseName: validation.data.courseName,
          courseTableId: tableId,
          id: { not: itemId },
        },
      });

      if (duplicateCourseItem) {
        return { error: "A course item with this name already exists" };
      }

      // If the course item is used, update the course name too
      if (existingCourseItem.isUsed) {
        await prisma.course.updateMany({
          where: {
            name: existingCourseItem.courseName,
            courseTableId: tableId,
          },
          data: {
            name: validation.data.courseName,
          },
        });
      }
    }

    const updatedCourseItem = await prisma.courseItem.update({
      where: {
        id: itemId,
      },
      data: validation.data,
    });

    revalidatePath("/");
    return { data: updatedCourseItem };
  } catch (error) {
    console.error("Failed to update course item:", error);
    return { error: "Failed to update course item" };
  }
}

// Delete a course item
export async function deleteCourseItem(
  tableId: string,
  itemId: string,
  userId: string,
  confirmDelete: boolean = false
) {
  if (!tableId || !itemId || !userId) {
    return { error: "Table ID, Item ID, and User ID are required" };
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

    // Get the course item to be deleted
    const courseItem = await prisma.courseItem.findUnique({
      where: {
        id: itemId,
        courseTableId: tableId,
      },
    });

    if (!courseItem) {
      return { error: "Course item not found" };
    }

    // If the course item is used, check and ask for confirmation
    if (courseItem.isUsed && !confirmDelete) {
      return { 
        error: "Course item is in use. Confirm deletion to proceed.",
        isUsed: true,
        needsConfirmation: true
      };
    }

    // If confirmed or not used, delete associated courses if needed
    if (courseItem.isUsed) {
      await prisma.course.deleteMany({
        where: {
          name: courseItem.courseName,
          courseTableId: tableId,
        },
      });
    }

    // Delete the course item
    await prisma.courseItem.delete({
      where: {
        id: itemId,
      },
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete course item:", error);
    return { error: "Failed to delete course item" };
  }
} 
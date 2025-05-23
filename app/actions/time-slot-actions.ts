"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Validation schemas
const TimeSlotSchema = z.object({
  start: z.string().regex(/^\d{2}:\d{2}$/, "Start time must be in format HH:MM"),
  end: z.string().regex(/^\d{2}:\d{2}$/, "End time must be in format HH:MM"),
  order: z.number().int().positive(),
});

const TimeSlotUpdateSchema = z.object({
  start: z.string().regex(/^\d{2}:\d{2}$/, "Start time must be in format HH:MM").optional(),
  end: z.string().regex(/^\d{2}:\d{2}$/, "End time must be in format HH:MM").optional(),
  order: z.number().int().positive().optional(),
});

// Get all time slots for a specific course table
export async function getTimeSlotsForTable(tableId: string, userId: string) {
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

    return await prisma.timeSlot.findMany({
      where: {
        courseTableId: tableId,
      },
      orderBy: {
        order: "asc",
      },
    });
  } catch (error) {
    console.error("Failed to fetch time slots:", error);
    throw new Error("Failed to fetch time slots");
  }
}

// Create a new time slot
export async function createTimeSlot(
  tableId: string,
  data: z.infer<typeof TimeSlotSchema>,
  userId: string
) {
  if (!tableId || !userId) {
    return { error: "Table ID and User ID are required" };
  }

  try {
    const validation = TimeSlotSchema.safeParse(data);
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

    // Check if there's already a time slot with this order
    const existingTimeSlot = await prisma.timeSlot.findFirst({
      where: {
        courseTableId: tableId,
        order: validation.data.order,
      },
    });

    if (existingTimeSlot) {
      return { error: "A time slot with this order already exists" };
    }

    // Convert HH:MM to Date objects
    const [startHour, startMinute] = validation.data.start.split(":").map(Number);
    const [endHour, endMinute] = validation.data.end.split(":").map(Number);

    const startDate = new Date(2000, 0, 1, startHour, startMinute);
    const endDate = new Date(2000, 0, 1, endHour, endMinute);

    // Check that end time is after start time
    if (endDate <= startDate) {
      return { error: "End time must be after start time" };
    }

    const timeSlot = await prisma.timeSlot.create({
      data: {
        start: startDate,
        end: endDate,
        order: validation.data.order,
        courseTableId: tableId,
      },
    });

    revalidatePath("/");
    return { data: timeSlot };
  } catch (error) {
    console.error("Failed to create time slot:", error);
    return { error: "Failed to create time slot" };
  }
}

// Update a time slot
export async function updateTimeSlot(
  tableId: string,
  slotId: number,
  data: z.infer<typeof TimeSlotUpdateSchema>,
  userId: string
) {
  if (!tableId || !slotId || !userId) {
    return { error: "Table ID, Slot ID, and User ID are required" };
  }

  try {
    const validation = TimeSlotUpdateSchema.safeParse(data);
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

    // Check if the time slot exists and belongs to the course table
    const existingTimeSlot = await prisma.timeSlot.findUnique({
      where: {
        id: slotId,
        courseTableId: tableId,
      },
    });

    if (!existingTimeSlot) {
      return { error: "Time slot not found" };
    }

    // If changing order, check if it's available
    if (validation.data.order && validation.data.order !== existingTimeSlot.order) {
      const conflictingTimeSlot = await prisma.timeSlot.findFirst({
        where: {
          courseTableId: tableId,
          order: validation.data.order,
          id: { not: slotId },
        },
      });

      if (conflictingTimeSlot) {
        return { error: "A time slot with this order already exists" };
      }
    }

    // Prepare the update data
    const updateData: {
      order?: number;
      start?: Date;
      end?: Date;
    } = {};

    if (validation.data.order) {
      updateData.order = validation.data.order;
    }

    // Convert time strings to Date objects if provided
    if (validation.data.start) {
      const [startHour, startMinute] = validation.data.start.split(":").map(Number);
      updateData.start = new Date(2000, 0, 1, startHour, startMinute);
    }

    if (validation.data.end) {
      const [endHour, endMinute] = validation.data.end.split(":").map(Number);
      updateData.end = new Date(2000, 0, 1, endHour, endMinute);
    }

    // Check that end time is after start time if both are provided
    if (updateData.start && updateData.end) {
      if (updateData.end <= updateData.start) {
        return { error: "End time must be after start time" };
      }
    } else if (updateData.start && !updateData.end) {
      // Check against existing end time
      if (new Date(updateData.start) >= existingTimeSlot.end) {
        return { error: "Start time must be before end time" };
      }
    } else if (!updateData.start && updateData.end) {
      // Check against existing start time
      if (existingTimeSlot.start >= new Date(updateData.end)) {
        return { error: "End time must be after start time" };
      }
    }

    const updatedTimeSlot = await prisma.timeSlot.update({
      where: {
        id: slotId,
      },
      data: updateData,
    });

    revalidatePath("/");
    return { data: updatedTimeSlot };
  } catch (error) {
    console.error("Failed to update time slot:", error);
    return { error: "Failed to update time slot" };
  }
}

// Delete a time slot
export async function deleteTimeSlot(
  tableId: string,
  slotId: number,
  userId: string,
  confirmDelete: boolean = false
) {
  if (!tableId || !slotId || !userId) {
    return { error: "Table ID, Slot ID, and User ID are required" };
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

    // Check if the time slot exists
    const timeSlot = await prisma.timeSlot.findUnique({
      where: {
        id: slotId,
        courseTableId: tableId,
      },
      include: {
        courses: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!timeSlot) {
      return { error: "Time slot not found" };
    }

    // Check if there are courses using this time slot
    if (timeSlot.courses.length > 0 && !confirmDelete) {
      return { 
        error: "Time slot has courses. Confirm deletion to proceed.",
        hasCourses: true,
        courseCount: timeSlot.courses.length,
        needsConfirmation: true
      };
    }

    // If confirmed or no courses, delete associated courses if needed
    if (timeSlot.courses.length > 0) {
      await prisma.course.deleteMany({
        where: {
          timeSlotId: slotId,
          courseTableId: tableId,
        },
      });
    }

    // Delete the time slot
    await prisma.timeSlot.delete({
      where: {
        id: slotId,
      },
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete time slot:", error);
    return { error: "Failed to delete time slot" };
  }
} 
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// GET /api/course-tables/[id]/time-slots/[slotId] - Get a specific time slot
export async function GET(
  request: Request,
  { params }: { params: { id: string; slotId: string } }
) {
  try {
    const userId = request.headers.get("x-user-id");
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized - User ID is required" },
        { status: 401 }
      );
    }

    // Check if the course table exists and belongs to the user
    const courseTable = await prisma.courseTable.findUnique({
      where: {
        id: params.id,
        userId,
      },
    });

    if (!courseTable) {
      return NextResponse.json(
        { error: "Course table not found or access denied" },
        { status: 404 }
      );
    }

    const timeSlot = await prisma.timeSlot.findUnique({
      where: {
        id: parseInt(params.slotId),
        courseTableId: params.id,
      },
    });

    if (!timeSlot) {
      return NextResponse.json(
        { error: "Time slot not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(timeSlot);
  } catch (error) {
    console.error("Error fetching time slot:", error);
    return NextResponse.json(
      { error: "Failed to fetch time slot" },
      { status: 500 }
    );
  }
}

// PUT /api/course-tables/[id]/time-slots/[slotId] - Update a time slot
export async function PUT(
  request: Request,
  { params }: { params: { id: string; slotId: string } }
) {
  try {
    const userId = request.headers.get("x-user-id");
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized - User ID is required" },
        { status: 401 }
      );
    }

    // Check if the course table exists and belongs to the user
    const courseTable = await prisma.courseTable.findUnique({
      where: {
        id: params.id,
        userId,
      },
    });

    if (!courseTable) {
      return NextResponse.json(
        { error: "Course table not found or access denied" },
        { status: 404 }
      );
    }

    // Check if the time slot exists and belongs to the course table
    const existingTimeSlot = await prisma.timeSlot.findUnique({
      where: {
        id: parseInt(params.slotId),
        courseTableId: params.id,
      },
    });

    if (!existingTimeSlot) {
      return NextResponse.json(
        { error: "Time slot not found" },
        { status: 404 }
      );
    }

    const TimeSlotSchema = z.object({
      start: z.string().regex(/^\d{2}:\d{2}$/, "Start time must be in format HH:MM").optional(),
      end: z.string().regex(/^\d{2}:\d{2}$/, "End time must be in format HH:MM").optional(),
      order: z.number().int().positive().optional(),
    });

    const body = await request.json();
    const validation = TimeSlotSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.format() },
        { status: 400 }
      );
    }

    // If changing order, check if it's available
    if (validation.data.order && validation.data.order !== existingTimeSlot.order) {
      const conflictingTimeSlot = await prisma.timeSlot.findFirst({
        where: {
          courseTableId: params.id,
          order: validation.data.order,
          id: { not: parseInt(params.slotId) },
        },
      });

      if (conflictingTimeSlot) {
        return NextResponse.json(
          { error: "A time slot with this order already exists" },
          { status: 409 }
        );
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
        return NextResponse.json(
          { error: "End time must be after start time" },
          { status: 400 }
        );
      }
    } else if (updateData.start && !updateData.end) {
      // Check against existing end time
      if (new Date(updateData.start) >= existingTimeSlot.end) {
        return NextResponse.json(
          { error: "Start time must be before end time" },
          { status: 400 }
        );
      }
    } else if (!updateData.start && updateData.end) {
      // Check against existing start time
      if (existingTimeSlot.start >= new Date(updateData.end)) {
        return NextResponse.json(
          { error: "End time must be after start time" },
          { status: 400 }
        );
      }
    }

    const updatedTimeSlot = await prisma.timeSlot.update({
      where: {
        id: parseInt(params.slotId),
      },
      data: updateData,
    });

    return NextResponse.json(updatedTimeSlot);
  } catch (error) {
    console.error("Error updating time slot:", error);
    return NextResponse.json(
      { error: "Failed to update time slot" },
      { status: 500 }
    );
  }
}

// DELETE /api/course-tables/[id]/time-slots/[slotId] - Delete a time slot
export async function DELETE(
  request: Request,
  { params }: { params: { id: string; slotId: string } }
) {
  try {
    const userId = request.headers.get("x-user-id");
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized - User ID is required" },
        { status: 401 }
      );
    }

    // Check if the course table exists and belongs to the user
    const courseTable = await prisma.courseTable.findUnique({
      where: {
        id: params.id,
        userId,
      },
    });

    if (!courseTable) {
      return NextResponse.json(
        { error: "Course table not found or access denied" },
        { status: 404 }
      );
    }

    // Check if the time slot exists
    const timeSlot = await prisma.timeSlot.findUnique({
      where: {
        id: parseInt(params.slotId),
        courseTableId: params.id,
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
      return NextResponse.json(
        { error: "Time slot not found" },
        { status: 404 }
      );
    }

    // Check if there are courses using this time slot
    if (timeSlot.courses.length > 0) {
      // Check if there's a confirming header
      const confirmDelete = request.headers.get("x-confirm-delete");
      if (!confirmDelete || confirmDelete !== "true") {
        return NextResponse.json(
          { 
            error: "Time slot has courses. Set x-confirm-delete header to true to confirm deletion.",
            hasCourses: true,
            courseCount: timeSlot.courses.length
          },
          { status: 409 }
        );
      }
      
      // Delete associated courses
      await prisma.course.deleteMany({
        where: {
          timeSlotId: parseInt(params.slotId),
          courseTableId: params.id,
        },
      });
    }

    // Delete the time slot
    await prisma.timeSlot.delete({
      where: {
        id: parseInt(params.slotId),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting time slot:", error);
    return NextResponse.json(
      { error: "Failed to delete time slot" },
      { status: 500 }
    );
  }
} 
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// GET /api/course-tables/[id]/time-slots/[slotId] - Get a specific time slot
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; slotId: string }> }
) {
  try {
    const { id, slotId } = await params;
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
        id,
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
        id: parseInt(slotId),
        courseTableId: id,
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
  { params }: { params: Promise<{ id: string; slotId: string }> }
) {
  try {
    const { id, slotId } = await params;
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
        id,
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
        id: parseInt(slotId),
        courseTableId: id,
      },
    });

    if (!existingTimeSlot) {
      return NextResponse.json(
        { error: "Time slot not found" },
        { status: 404 }
      );
    }

    const TimeSlotSchema = z.object({
      start: z.string().datetime().optional(),
      end: z.string().datetime().optional(),
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

    // Convert string dates to Date objects if provided
    const updateData: any = {};
    if (validation.data.start) {
      updateData.start = new Date(validation.data.start);
    }
    if (validation.data.end) {
      updateData.end = new Date(validation.data.end);
    }
    if (validation.data.order !== undefined) {
      updateData.order = validation.data.order;
    }

    // Validate that start time is before end time
    const startTime = updateData.start || existingTimeSlot.start;
    const endTime = updateData.end || existingTimeSlot.end;
    
    if (startTime >= endTime) {
      return NextResponse.json(
        { error: "Start time must be before end time" },
        { status: 400 }
      );
    }

    // If changing the order, check if it's unique
    if (validation.data.order && validation.data.order !== existingTimeSlot.order) {
      const duplicateTimeSlot = await prisma.timeSlot.findFirst({
        where: {
          order: validation.data.order,
          courseTableId: id,
          id: { not: parseInt(slotId) },
        },
      });

      if (duplicateTimeSlot) {
        return NextResponse.json(
          { error: "A time slot with this order already exists" },
          { status: 409 }
        );
      }
    }

    const updatedTimeSlot = await prisma.timeSlot.update({
      where: {
        id: parseInt(slotId),
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
  { params }: { params: Promise<{ id: string; slotId: string }> }
) {
  try {
    const { id, slotId } = await params;
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
        id,
        userId,
      },
    });

    if (!courseTable) {
      return NextResponse.json(
        { error: "Course table not found or access denied" },
        { status: 404 }
      );
    }

    // Get the time slot to be deleted
    const timeSlot = await prisma.timeSlot.findUnique({
      where: {
        id: parseInt(slotId),
        courseTableId: id,
      },
    });

    if (!timeSlot) {
      return NextResponse.json(
        { error: "Time slot not found" },
        { status: 404 }
      );
    }

    // Check if there are any courses using this time slot
    const coursesUsingSlot = await prisma.course.findMany({
      where: {
        timeSlotId: parseInt(slotId),
        courseTableId: id,
      },
    });

    if (coursesUsingSlot.length > 0) {
      return NextResponse.json(
        { 
          error: "Cannot delete time slot because it is being used by courses",
          coursesCount: coursesUsingSlot.length
        },
        { status: 409 }
      );
    }

    // Delete the time slot
    await prisma.timeSlot.delete({
      where: {
        id: parseInt(slotId),
      },
    });

    return NextResponse.json({ message: "Time slot deleted successfully" });
  } catch (error) {
    console.error("Error deleting time slot:", error);
    return NextResponse.json(
      { error: "Failed to delete time slot" },
      { status: 500 }
    );
  }
} 
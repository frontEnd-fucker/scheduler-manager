import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// GET /api/course-tables/[id]/courses/[courseId] - Get a specific course
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; courseId: string }> }
) {
  try {
    const { id, courseId } = await params;
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

    const course = await prisma.course.findUnique({
      where: {
        id: courseId,
        courseTableId: id,
      },
      include: {
        timeSlot: true,
      },
    });

    if (!course) {
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 }
      );
    }

    // Transform the data to include startTime and endTime
    const transformedCourse = {
      ...course,
      startTime: course.timeSlot.start,
      endTime: course.timeSlot.end,
    };

    return NextResponse.json(transformedCourse);
  } catch (error) {
    console.error("Error fetching course:", error);
    return NextResponse.json(
      { error: "Failed to fetch course" },
      { status: 500 }
    );
  }
}

// PUT /api/course-tables/[id]/courses/[courseId] - Update a course
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; courseId: string }> }
) {
  try {
    const { id, courseId } = await params;
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

    // Check if the course exists and belongs to the course table
    const existingCourse = await prisma.course.findUnique({
      where: {
        id: courseId,
        courseTableId: id,
      },
    });

    if (!existingCourse) {
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 }
      );
    }

    const CourseSchema = z.object({
      name: z.string().min(1, "Course name is required").optional(),
      dayOfWeek: z.number().min(1).max(7).optional(),
      timeSlotId: z.number().optional(),
    });

    const body = await request.json();
    const validation = CourseSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.format() },
        { status: 400 }
      );
    }

    // If changing time slot, check if it exists
    if (validation.data.timeSlotId && validation.data.timeSlotId !== existingCourse.timeSlotId) {
      const timeSlot = await prisma.timeSlot.findFirst({
        where: {
          id: validation.data.timeSlotId,
          courseTableId: id,
        },
      });

      if (!timeSlot) {
        return NextResponse.json(
          { error: "Time slot not found" },
          { status: 404 }
        );
      }
    }

    // If changing day or time slot, check for conflicts
    const newDayOfWeek = validation.data.dayOfWeek || existingCourse.dayOfWeek;
    const newTimeSlotId = validation.data.timeSlotId || existingCourse.timeSlotId;

    if (newDayOfWeek !== existingCourse.dayOfWeek || newTimeSlotId !== existingCourse.timeSlotId) {
      const conflictingCourse = await prisma.course.findFirst({
        where: {
          courseTableId: id,
          dayOfWeek: newDayOfWeek,
          timeSlotId: newTimeSlotId,
          id: { not: courseId },
        },
      });

      if (conflictingCourse) {
        return NextResponse.json(
          { error: "A course already exists at this time slot" },
          { status: 409 }
        );
      }
    }

    const updatedCourse = await prisma.course.update({
      where: {
        id: courseId,
      },
      data: validation.data,
      include: {
        timeSlot: true,
      },
    });

    // Transform the data to include startTime and endTime
    const transformedCourse = {
      ...updatedCourse,
      startTime: updatedCourse.timeSlot.start,
      endTime: updatedCourse.timeSlot.end,
    };

    return NextResponse.json(transformedCourse);
  } catch (error) {
    console.error("Error updating course:", error);
    return NextResponse.json(
      { error: "Failed to update course" },
      { status: 500 }
    );
  }
}

// DELETE /api/course-tables/[id]/courses/[courseId] - Delete a course
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; courseId: string }> }
) {
  try {
    const { id, courseId } = await params;
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

    // Get the course to be deleted
    const course = await prisma.course.findUnique({
      where: {
        id: courseId,
        courseTableId: id,
      },
    });

    if (!course) {
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 }
      );
    }

    // Delete the course
    await prisma.course.delete({
      where: {
        id: courseId,
      },
    });

    return NextResponse.json({ message: "Course deleted successfully" });
  } catch (error) {
    console.error("Error deleting course:", error);
    return NextResponse.json(
      { error: "Failed to delete course" },
      { status: 500 }
    );
  }
} 
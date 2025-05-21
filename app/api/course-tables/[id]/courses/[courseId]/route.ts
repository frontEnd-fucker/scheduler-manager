import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// GET /api/course-tables/[id]/courses/[courseId] - Get a specific course
export async function GET(
  request: Request,
  { params }: { params: { id: string; courseId: string } }
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

    const course = await prisma.course.findUnique({
      where: {
        id: params.courseId,
        courseTableId: params.id,
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

    return NextResponse.json(course);
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
  { params }: { params: { id: string; courseId: string } }
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

    // Check if the course exists and belongs to the course table
    const existingCourse = await prisma.course.findUnique({
      where: {
        id: params.courseId,
        courseTableId: params.id,
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
      dayOfWeek: z.number().min(1).max(5).optional(),
      timeSlotId: z.number().int().positive().optional(),
    });

    const body = await request.json();
    const validation = CourseSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.format() },
        { status: 400 }
      );
    }

    // If changing time slot or day, check if it's available
    if (validation.data.dayOfWeek || validation.data.timeSlotId) {
      const newDayOfWeek = validation.data.dayOfWeek || existingCourse.dayOfWeek;
      const newTimeSlotId = validation.data.timeSlotId || existingCourse.timeSlotId;

      // Check if there's already a course in this day and time slot (excluding the current course)
      const conflictingCourse = await prisma.course.findFirst({
        where: {
          courseTableId: params.id,
          dayOfWeek: newDayOfWeek,
          timeSlotId: newTimeSlotId,
          id: { not: params.courseId },
        },
      });

      if (conflictingCourse) {
        return NextResponse.json(
          { error: "A course already exists in this day and time slot" },
          { status: 409 }
        );
      }
    }

    // If changing the name, update the isUsed flag for course items
    if (validation.data.name && validation.data.name !== existingCourse.name) {
      // Set the old course item to not used
      await prisma.courseItem.updateMany({
        where: {
          courseName: existingCourse.name,
          courseTableId: params.id,
        },
        data: {
          isUsed: false,
        },
      });

      // Set the new course item to used
      await prisma.courseItem.updateMany({
        where: {
          courseName: validation.data.name,
          courseTableId: params.id,
        },
        data: {
          isUsed: true,
        },
      });
    }

    const updatedCourse = await prisma.course.update({
      where: {
        id: params.courseId,
      },
      data: validation.data,
    });

    return NextResponse.json(updatedCourse);
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
  { params }: { params: { id: string; courseId: string } }
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

    // Get the course to be deleted
    const course = await prisma.course.findUnique({
      where: {
        id: params.courseId,
        courseTableId: params.id,
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
        id: params.courseId,
      },
    });

    // Update the course item to not used
    await prisma.courseItem.updateMany({
      where: {
        courseName: course.name,
        courseTableId: params.id,
      },
      data: {
        isUsed: false,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting course:", error);
    return NextResponse.json(
      { error: "Failed to delete course" },
      { status: 500 }
    );
  }
} 
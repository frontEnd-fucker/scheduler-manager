import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// GET /api/course-tables/[id] - Get a specific course table
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = request.headers.get("x-user-id");
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized - User ID is required" },
        { status: 401 }
      );
    }

    const courseTable = await prisma.courseTable.findUnique({
      where: {
        id,
        userId,
      },
      include: {
        courses: {
          include: {
            timeSlot: true,
          },
        },
        timeSlots: {
          orderBy: { order: 'asc' },
        },
        courseItems: true,
      },
    });

    if (!courseTable) {
      return NextResponse.json(
        { error: "Course table not found or access denied" },
        { status: 404 }
      );
    }

    // Transform the data to match the expected format
    const transformedCourseTable = {
      ...courseTable,
      courses: courseTable.courses.map(course => ({
        ...course,
        startTime: course.timeSlot.start,
        endTime: course.timeSlot.end,
      })),
    };

    return NextResponse.json(transformedCourseTable);
  } catch (error) {
    console.error("Error fetching course table:", error);
    return NextResponse.json(
      { error: "Failed to fetch course table" },
      { status: 500 }
    );
  }
}

// PUT /api/course-tables/[id] - Update a course table
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = request.headers.get("x-user-id");
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized - User ID is required" },
        { status: 401 }
      );
    }

    // Check if the course table exists and belongs to the user
    const existingCourseTable = await prisma.courseTable.findUnique({
      where: {
        id,
        userId,
      },
    });

    if (!existingCourseTable) {
      return NextResponse.json(
        { error: "Course table not found or access denied" },
        { status: 404 }
      );
    }

    const CourseTableSchema = z.object({
      name: z.string().min(1, "Course table name is required").optional(),
    });

    const body = await request.json();
    const validation = CourseTableSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.format() },
        { status: 400 }
      );
    }

    // If changing the name, check if it's unique for this user
    if (validation.data.name && validation.data.name !== existingCourseTable.name) {
      const duplicateCourseTable = await prisma.courseTable.findFirst({
        where: {
          name: validation.data.name,
          userId,
          id: { not: id },
        },
      });

      if (duplicateCourseTable) {
        return NextResponse.json(
          { error: "A course table with this name already exists" },
          { status: 409 }
        );
      }
    }

    const updatedCourseTable = await prisma.courseTable.update({
      where: {
        id,
      },
      data: validation.data,
      include: {
        courses: {
          include: {
            timeSlot: true,
          },
        },
        timeSlots: {
          orderBy: { order: 'asc' },
        },
        courseItems: true,
      },
    });

    return NextResponse.json(updatedCourseTable);
  } catch (error) {
    console.error("Error updating course table:", error);
    return NextResponse.json(
      { error: "Failed to update course table" },
      { status: 500 }
    );
  }
}

// DELETE /api/course-tables/[id] - Delete a course table
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Delete the course table (this will cascade delete courses, timeSlots, and courseItems)
    await prisma.courseTable.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({ message: "Course table deleted successfully" });
  } catch (error) {
    console.error("Error deleting course table:", error);
    return NextResponse.json(
      { error: "Failed to delete course table" },
      { status: 500 }
    );
  }
} 
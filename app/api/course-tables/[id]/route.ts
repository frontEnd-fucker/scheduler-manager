import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// GET /api/course-tables/[id] - Get a specific course table
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get("x-user-id");
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized - User ID is required" },
        { status: 401 }
      );
    }

    const courseTable = await prisma.courseTable.findUnique({
      where: {
        id: params.id,
        userId, // Ensure the table belongs to the user
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
      return NextResponse.json(
        { error: "Course table not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(courseTable);
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
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get("x-user-id");
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized - User ID is required" },
        { status: 401 }
      );
    }

    // First check if the course table exists and belongs to the user
    const existingTable = await prisma.courseTable.findUnique({
      where: {
        id: params.id,
        userId,
      },
    });

    if (!existingTable) {
      return NextResponse.json(
        { error: "Course table not found or access denied" },
        { status: 404 }
      );
    }

    const CourseTableSchema = z.object({
      name: z.string().min(1, "Course table name is required"),
    });

    const body = await request.json();
    const validation = CourseTableSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.format() },
        { status: 400 }
      );
    }

    const updatedCourseTable = await prisma.courseTable.update({
      where: {
        id: params.id,
      },
      data: {
        name: validation.data.name,
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
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get("x-user-id");
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized - User ID is required" },
        { status: 401 }
      );
    }

    // First check if the course table exists and belongs to the user
    const existingTable = await prisma.courseTable.findUnique({
      where: {
        id: params.id,
        userId,
      },
    });

    if (!existingTable) {
      return NextResponse.json(
        { error: "Course table not found or access denied" },
        { status: 404 }
      );
    }

    // Delete the course table (cascades to courses, timeSlots, and courseItems)
    await prisma.courseTable.delete({
      where: {
        id: params.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting course table:", error);
    return NextResponse.json(
      { error: "Failed to delete course table" },
      { status: 500 }
    );
  }
} 
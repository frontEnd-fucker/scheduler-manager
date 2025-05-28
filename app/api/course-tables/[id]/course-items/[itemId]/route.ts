import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// GET /api/course-tables/[id]/course-items/[itemId] - Get a specific course item
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id, itemId } = await params;
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

    const courseItem = await prisma.courseItem.findUnique({
      where: {
        id: itemId,
        courseTableId: id,
      },
    });

    if (!courseItem) {
      return NextResponse.json(
        { error: "Course item not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(courseItem);
  } catch (error) {
    console.error("Error fetching course item:", error);
    return NextResponse.json(
      { error: "Failed to fetch course item" },
      { status: 500 }
    );
  }
}

// PUT /api/course-tables/[id]/course-items/[itemId] - Update a course item
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id, itemId } = await params;
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

    // Check if the course item exists and belongs to the course table
    const existingCourseItem = await prisma.courseItem.findUnique({
      where: {
        id: itemId,
        courseTableId: id,
      },
    });

    if (!existingCourseItem) {
      return NextResponse.json(
        { error: "Course item not found" },
        { status: 404 }
      );
    }

    const CourseItemSchema = z.object({
      courseName: z.string().min(1, "Course name is required").optional(),
      isUsed: z.boolean().optional(),
    });

    const body = await request.json();
    const validation = CourseItemSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.format() },
        { status: 400 }
      );
    }

    // If changing the name, check if it's unique
    if (validation.data.courseName && validation.data.courseName !== existingCourseItem.courseName) {
      const duplicateCourseItem = await prisma.courseItem.findFirst({
        where: {
          courseName: validation.data.courseName,
          courseTableId: id,
          id: { not: itemId },
        },
      });

      if (duplicateCourseItem) {
        return NextResponse.json(
          { error: "A course item with this name already exists" },
          { status: 409 }
        );
      }

      // If the course item is used, update the course name too
      if (existingCourseItem.isUsed) {
        await prisma.course.updateMany({
          where: {
            name: existingCourseItem.courseName,
            courseTableId: id,
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

    return NextResponse.json(updatedCourseItem);
  } catch (error) {
    console.error("Error updating course item:", error);
    return NextResponse.json(
      { error: "Failed to update course item" },
      { status: 500 }
    );
  }
}

// DELETE /api/course-tables/[id]/course-items/[itemId] - Delete a course item
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id, itemId } = await params;
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

    // Get the course item to be deleted
    const courseItem = await prisma.courseItem.findUnique({
      where: {
        id: itemId,
        courseTableId: id,
      },
    });

    if (!courseItem) {
      return NextResponse.json(
        { error: "Course item not found" },
        { status: 404 }
      );
    }

    // If the course item is used, delete all associated courses first
    if (courseItem.isUsed) {
      await prisma.course.deleteMany({
        where: {
          name: courseItem.courseName,
          courseTableId: id,
        },
      });
    }

    // Delete the course item
    await prisma.courseItem.delete({
      where: {
        id: itemId,
      },
    });

    return NextResponse.json({ message: "Course item deleted successfully" });
  } catch (error) {
    console.error("Error deleting course item:", error);
    return NextResponse.json(
      { error: "Failed to delete course item" },
      { status: 500 }
    );
  }
} 
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// GET /api/course-tables/[id]/course-items/[itemId] - Get a specific course item
export async function GET(
  request: Request,
  { params }: { params: { id: string; itemId: string } }
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

    const courseItem = await prisma.courseItem.findUnique({
      where: {
        id: params.itemId,
        courseTableId: params.id,
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
  { params }: { params: { id: string; itemId: string } }
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

    // Check if the course item exists and belongs to the course table
    const existingCourseItem = await prisma.courseItem.findUnique({
      where: {
        id: params.itemId,
        courseTableId: params.id,
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
          courseTableId: params.id,
          id: { not: params.itemId },
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
            courseTableId: params.id,
          },
          data: {
            name: validation.data.courseName,
          },
        });
      }
    }

    const updatedCourseItem = await prisma.courseItem.update({
      where: {
        id: params.itemId,
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
  { params }: { params: { id: string; itemId: string } }
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

    // Get the course item to be deleted
    const courseItem = await prisma.courseItem.findUnique({
      where: {
        id: params.itemId,
        courseTableId: params.id,
      },
    });

    if (!courseItem) {
      return NextResponse.json(
        { error: "Course item not found" },
        { status: 404 }
      );
    }

    // If the course item is used, check and ask for confirmation
    if (courseItem.isUsed) {
      // Check if there's a confirming header
      const confirmDelete = request.headers.get("x-confirm-delete");
      if (!confirmDelete || confirmDelete !== "true") {
        return NextResponse.json(
          { 
            error: "Course item is in use. Set x-confirm-delete header to true to confirm deletion.",
            isUsed: true
          },
          { status: 409 }
        );
      }
      
      // Delete associated courses
      await prisma.course.deleteMany({
        where: {
          name: courseItem.courseName,
          courseTableId: params.id,
        },
      });
    }

    // Delete the course item
    await prisma.courseItem.delete({
      where: {
        id: params.itemId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting course item:", error);
    return NextResponse.json(
      { error: "Failed to delete course item" },
      { status: 500 }
    );
  }
} 
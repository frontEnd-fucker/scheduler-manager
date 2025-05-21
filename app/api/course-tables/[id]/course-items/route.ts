import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// GET /api/course-tables/[id]/course-items - Get all course items for a specific course table
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

    const courseItems = await prisma.courseItem.findMany({
      where: {
        courseTableId: params.id,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json(courseItems);
  } catch (error) {
    console.error("Error fetching course items:", error);
    return NextResponse.json(
      { error: "Failed to fetch course items" },
      { status: 500 }
    );
  }
}

// POST /api/course-tables/[id]/course-items - Create a new course item
export async function POST(
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

    const CourseItemSchema = z.object({
      courseName: z.string().min(1, "Course name is required"),
    });

    const body = await request.json();
    const validation = CourseItemSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.format() },
        { status: 400 }
      );
    }

    // Check if a course item with this name already exists in this course table
    const existingCourseItem = await prisma.courseItem.findFirst({
      where: {
        courseName: validation.data.courseName,
        courseTableId: params.id,
      },
    });

    if (existingCourseItem) {
      return NextResponse.json(
        { error: "A course item with this name already exists" },
        { status: 409 }
      );
    }

    const courseItem = await prisma.courseItem.create({
      data: {
        courseName: validation.data.courseName,
        courseTableId: params.id,
        isUsed: false,
      },
    });

    return NextResponse.json(courseItem, { status: 201 });
  } catch (error) {
    console.error("Error creating course item:", error);
    return NextResponse.json(
      { error: "Failed to create course item" },
      { status: 500 }
    );
  }
} 
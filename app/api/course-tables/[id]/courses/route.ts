import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// GET /api/course-tables/[id]/courses - Get all courses for a course table
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

    const courses = await prisma.course.findMany({
      where: {
        courseTableId: id,
      },
      include: {
        timeSlot: true,
      },
    });

    // Transform the data to include startTime and endTime
    const transformedCourses = courses.map(course => ({
      ...course,
      startTime: course.timeSlot.start,
      endTime: course.timeSlot.end,
    }));

    return NextResponse.json(transformedCourses);
  } catch (error) {
    console.error("Error fetching courses:", error);
    return NextResponse.json(
      { error: "Failed to fetch courses" },
      { status: 500 }
    );
  }
}

// POST /api/course-tables/[id]/courses - Create a new course
export async function POST(
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

    const CourseSchema = z.object({
      name: z.string().min(1, "Course name is required"),
      dayOfWeek: z.number().min(1).max(7),
      timeSlotId: z.number(),
    });

    const body = await request.json();
    const validation = CourseSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.format() },
        { status: 400 }
      );
    }

    // Check if the time slot exists for this course table
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

    // Check if there's already a course at this time slot and day
    const existingCourse = await prisma.course.findFirst({
      where: {
        courseTableId: id,
        dayOfWeek: validation.data.dayOfWeek,
        timeSlotId: validation.data.timeSlotId,
      },
    });

    if (existingCourse) {
      return NextResponse.json(
        { error: "A course already exists at this time slot" },
        { status: 409 }
      );
    }

    const course = await prisma.course.create({
      data: {
        name: validation.data.name,
        dayOfWeek: validation.data.dayOfWeek,
        timeSlotId: validation.data.timeSlotId,
        courseTableId: id,
      },
      include: {
        timeSlot: true,
      },
    });

    // Transform the data to include startTime and endTime
    const transformedCourse = {
      ...course,
      startTime: course.timeSlot.start,
      endTime: course.timeSlot.end,
    };

    return NextResponse.json(transformedCourse, { status: 201 });
  } catch (error) {
    console.error("Error creating course:", error);
    return NextResponse.json(
      { error: "Failed to create course" },
      { status: 500 }
    );
  }
} 
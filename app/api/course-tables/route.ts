import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// GET /api/course-tables - Get all course tables for the current user
export async function GET(request: Request) {
  try {
    const userId = request.headers.get("x-user-id");
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized - User ID is required" },
        { status: 401 }
      );
    }

    const courseTables = await prisma.courseTable.findMany({
      where: { userId },
      include: {
        timeSlots: {
          orderBy: { order: "asc" },
        },
        courses: true,
        courseItems: true,
      },
    });

    return NextResponse.json(courseTables);
  } catch (error) {
    console.error("Error fetching course tables:", error);
    return NextResponse.json(
      { error: "Failed to fetch course tables" },
      { status: 500 }
    );
  }
}

// POST /api/course-tables - Create a new course table
export async function POST(request: Request) {
  try {
    const userId = request.headers.get("x-user-id");
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized - User ID is required" },
        { status: 401 }
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

    // Create default time slots
    const defaultTimeSlots = [
      { start: new Date("2000-01-01T08:00:00"), end: new Date("2000-01-01T09:30:00"), order: 1 },
      { start: new Date("2000-01-01T09:30:00"), end: new Date("2000-01-01T11:00:00"), order: 2 },
      { start: new Date("2000-01-01T11:10:00"), end: new Date("2000-01-01T12:40:00"), order: 3 },
      { start: new Date("2000-01-01T12:40:00"), end: new Date("2000-01-01T14:10:00"), order: 4 },
      { start: new Date("2000-01-01T14:30:00"), end: new Date("2000-01-01T16:00:00"), order: 5 },
      { start: new Date("2000-01-01T16:10:00"), end: new Date("2000-01-01T17:40:00"), order: 6 },
    ];

    const courseTable = await prisma.courseTable.create({
      data: {
        name: validation.data.name,
        userId,
        timeSlots: {
          create: defaultTimeSlots,
        },
      },
      include: {
        timeSlots: true,
      },
    });

    return NextResponse.json(courseTable, { status: 201 });
  } catch (error) {
    console.error("Error creating course table:", error);
    return NextResponse.json(
      { error: "Failed to create course table" },
      { status: 500 }
    );
  }
} 
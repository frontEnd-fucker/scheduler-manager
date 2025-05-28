import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// GET /api/course-tables/[id]/time-slots - Get all time slots for a course table
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

    const timeSlots = await prisma.timeSlot.findMany({
      where: {
        courseTableId: id,
      },
      orderBy: {
        order: "asc",
      },
    });

    return NextResponse.json(timeSlots);
  } catch (error) {
    console.error("Error fetching time slots:", error);
    return NextResponse.json(
      { error: "Failed to fetch time slots" },
      { status: 500 }
    );
  }
}

// POST /api/course-tables/[id]/time-slots - Create a new time slot
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

    const TimeSlotSchema = z.object({
      start: z.string().regex(/^\d{2}:\d{2}$/, "Start time must be in format HH:MM"),
      end: z.string().regex(/^\d{2}:\d{2}$/, "End time must be in format HH:MM"),
      order: z.number().int().positive("Order must be a positive integer"),
    }).refine(
      (data) => data.start < data.end,
      {
        message: "Start time must be before end time",
        path: ["end"],
      }
    );

    const body = await request.json();
    const validation = TimeSlotSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.format() },
        { status: 400 }
      );
    }

    // Check if a time slot with this order already exists in this course table
    const existingTimeSlot = await prisma.timeSlot.findFirst({
      where: {
        order: validation.data.order,
        courseTableId: id,
      },
    });

    if (existingTimeSlot) {
      return NextResponse.json(
        { error: "A time slot with this order already exists" },
        { status: 409 }
      );
    }

    // Convert HH:MM to Date objects
    const [startHour, startMinute] = validation.data.start.split(":").map(Number);
    const [endHour, endMinute] = validation.data.end.split(":").map(Number);

    const startDate = new Date(2000, 0, 1, startHour, startMinute);
    const endDate = new Date(2000, 0, 1, endHour, endMinute);

    const timeSlot = await prisma.timeSlot.create({
      data: {
        start: startDate,
        end: endDate,
        order: validation.data.order,
        courseTableId: id,
      },
    });

    return NextResponse.json(timeSlot, { status: 201 });
  } catch (error) {
    console.error("Error creating time slot:", error);
    return NextResponse.json(
      { error: "Failed to create time slot" },
      { status: 500 }
    );
  }
} 
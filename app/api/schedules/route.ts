import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { auth } from '@clerk/nextjs/server';

// 验证模式
const createScheduleSchema = z.object({
  name: z.string().min(1, "课程表名称不能为空").max(50, "课程表名称不能超过50个字符"),
  description: z.string().max(200, "描述不能超过200个字符").optional(),
});

// GET /api/schedules - 获取当前用户的所有课程表
export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "未登录" },
        { status: 401 }
      );
    }

    const schedules = await prisma.courseTable.findMany({
      where: { userId },
      include: {
        courses: {
          include: {
            timeSlot: true,
          },
        },
        _count: {
          select: { courses: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // 转换数据格式以匹配前端需求
    const transformedSchedules = schedules.map(schedule => ({
      id: schedule.id,
      name: schedule.name,
      description: undefined, // 当前schema中没有description字段
      createdAt: schedule.createdAt,
      updatedAt: schedule.updatedAt,
      courses: schedule.courses.map(course => ({
        id: course.id,
        name: course.name,
        dayOfWeek: course.dayOfWeek,
        timeSlotId: course.timeSlotId,
        startTime: course.timeSlot.start,
        endTime: course.timeSlot.end,
      })),
      _count: schedule._count,
    }));

    return NextResponse.json(transformedSchedules);
  } catch (error) {
    console.error("获取课程表失败:", error);
    return NextResponse.json(
      { error: "获取课程表失败" },
      { status: 500 }
    );
  }
}

// POST /api/schedules - 创建新课程表
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "未登录" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = createScheduleSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0]?.message || "数据验证失败" },
        { status: 400 }
      );
    }

    // 创建默认时间段
    const defaultTimeSlots = [
      { start: new Date("2000-01-01T08:00:00"), end: new Date("2000-01-01T08:45:00"), order: 1 },
      { start: new Date("2000-01-01T08:55:00"), end: new Date("2000-01-01T09:40:00"), order: 2 },
      { start: new Date("2000-01-01T10:00:00"), end: new Date("2000-01-01T10:45:00"), order: 3 },
      { start: new Date("2000-01-01T10:55:00"), end: new Date("2000-01-01T11:40:00"), order: 4 },
      { start: new Date("2000-01-01T14:00:00"), end: new Date("2000-01-01T14:45:00"), order: 5 },
      { start: new Date("2000-01-01T14:55:00"), end: new Date("2000-01-01T15:40:00"), order: 6 },
      { start: new Date("2000-01-01T16:00:00"), end: new Date("2000-01-01T16:45:00"), order: 7 },
      { start: new Date("2000-01-01T16:55:00"), end: new Date("2000-01-01T17:40:00"), order: 8 },
    ];

    const schedule = await prisma.courseTable.create({
      data: {
        name: validation.data.name,
        userId,
        timeSlots: {
          create: defaultTimeSlots,
        },
      },
      include: {
        courses: {
          include: {
            timeSlot: true,
          },
        },
        _count: {
          select: { courses: true },
        },
      },
    });

    // 转换数据格式
    const transformedSchedule = {
      id: schedule.id,
      name: schedule.name,
      description: validation.data.description,
      createdAt: schedule.createdAt,
      updatedAt: schedule.updatedAt,
      courses: schedule.courses.map(course => ({
        id: course.id,
        name: course.name,
        dayOfWeek: course.dayOfWeek,
        timeSlotId: course.timeSlotId,
        startTime: course.timeSlot.start,
        endTime: course.timeSlot.end,
      })),
      _count: schedule._count,
    };

    return NextResponse.json(transformedSchedule, { status: 201 });
  } catch (error) {
    console.error("创建课程表失败:", error);
    return NextResponse.json(
      { error: "创建课程表失败" },
      { status: 500 }
    );
  }
} 
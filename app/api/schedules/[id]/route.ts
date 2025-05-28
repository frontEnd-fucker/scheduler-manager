import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { auth } from '@clerk/nextjs/server';

// 验证模式
const updateScheduleSchema = z.object({
  name: z.string().min(1, "课程表名称不能为空").max(50, "课程表名称不能超过50个字符"),
  description: z.string().max(200, "描述不能超过200个字符").optional(),
});

// GET /api/schedules/[id] - 获取单个课程表
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "未登录" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const schedule = await prisma.courseTable.findUnique({
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
        _count: {
          select: { courses: true },
        },
      },
    });

    if (!schedule) {
      return NextResponse.json(
        { error: "课程表不存在" },
        { status: 404 }
      );
    }

    // 转换数据格式
    const transformedSchedule = {
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
    };

    return NextResponse.json(transformedSchedule);
  } catch (error) {
    console.error("获取课程表失败:", error);
    return NextResponse.json(
      { error: "获取课程表失败" },
      { status: 500 }
    );
  }
}

// PUT /api/schedules/[id] - 更新课程表
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "未登录" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // 验证课程表是否存在且属于当前用户
    const existingSchedule = await prisma.courseTable.findUnique({
      where: {
        id,
        userId,
      },
    });

    if (!existingSchedule) {
      return NextResponse.json(
        { error: "课程表不存在或无权限修改" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validation = updateScheduleSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0]?.message || "数据验证失败" },
        { status: 400 }
      );
    }

    // 如果修改名称，检查是否与其他课程表重名
    if (validation.data.name !== existingSchedule.name) {
      const duplicateSchedule = await prisma.courseTable.findFirst({
        where: {
          name: validation.data.name,
          userId,
          id: { not: id },
        },
      });

      if (duplicateSchedule) {
        return NextResponse.json(
          { error: "已存在同名的课程表" },
          { status: 409 }
        );
      }
    }

    const updatedSchedule = await prisma.courseTable.update({
      where: {
        id,
      },
      data: {
        name: validation.data.name,
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
      id: updatedSchedule.id,
      name: updatedSchedule.name,
      description: validation.data.description,
      createdAt: updatedSchedule.createdAt,
      updatedAt: updatedSchedule.updatedAt,
      courses: updatedSchedule.courses.map(course => ({
        id: course.id,
        name: course.name,
        dayOfWeek: course.dayOfWeek,
        timeSlotId: course.timeSlotId,
        startTime: course.timeSlot.start,
        endTime: course.timeSlot.end,
      })),
      _count: updatedSchedule._count,
    };

    return NextResponse.json(transformedSchedule);
  } catch (error) {
    console.error("更新课程表失败:", error);
    return NextResponse.json(
      { error: "更新课程表失败" },
      { status: 500 }
    );
  }
}

// DELETE /api/schedules/[id] - 删除课程表
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "未登录" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // 验证课程表是否存在且属于当前用户
    const existingSchedule = await prisma.courseTable.findUnique({
      where: {
        id,
        userId,
      },
    });

    if (!existingSchedule) {
      return NextResponse.json(
        { error: "课程表不存在或无权限删除" },
        { status: 404 }
      );
    }

    await prisma.courseTable.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("删除课程表失败:", error);
    return NextResponse.json(
      { error: "删除课程表失败" },
      { status: 500 }
    );
  }
} 
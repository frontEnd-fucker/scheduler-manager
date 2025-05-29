"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from '@clerk/nextjs/server';

// 验证模式
const createScheduleSchema = z.object({
  name: z.string().min(1, "课程表名称不能为空").max(50, "课程表名称不能超过50个字符"),
  description: z.string().max(200, "描述不能超过200个字符").optional(),
});

const updateScheduleSchema = z.object({
  name: z.string().min(1, "课程表名称不能为空").max(50, "课程表名称不能超过50个字符"),
  description: z.string().max(200, "描述不能超过200个字符").optional(),
});

// 类型定义
export type Schedule = {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  courses: Array<{
    id: string;
    name: string;
    dayOfWeek: number;
    timeSlotId: number;
    startTime: Date;
    endTime: Date;
  }>;
  _count: {
    courses: number;
  };
};

// 获取当前用户的所有课程表
export async function getSchedules(): Promise<{ data?: Schedule[]; error?: string }> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return { error: "未登录" };
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
    const transformedSchedules: Schedule[] = schedules.map(schedule => ({
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

    return { data: transformedSchedules };
  } catch (error) {
    console.error("获取课程表失败:", error);
    return { error: "获取课程表失败" };
  }
}

// 创建新课程表
export async function createSchedule(
  data: z.infer<typeof createScheduleSchema>
): Promise<{ data?: Schedule; error?: string }> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return { error: "未登录" };
    }

    const validation = createScheduleSchema.safeParse(data);
    if (!validation.success) {
      return { error: validation.error.errors[0]?.message || "数据验证失败" };
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
    const transformedSchedule: Schedule = {
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

    revalidatePath("/dashboard");
    revalidatePath("/schedules");
    return { data: transformedSchedule };
  } catch (error) {
    console.error("创建课程表失败:", error);
    return { error: "创建课程表失败" };
  }
}

// 删除课程表
export async function deleteSchedule(scheduleId: string): Promise<{ success?: boolean; error?: string }> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return { error: "未登录" };
    }

    // 验证课程表是否存在且属于当前用户
    const existingSchedule = await prisma.courseTable.findUnique({
      where: {
        id: scheduleId,
        userId,
      },
    });

    if (!existingSchedule) {
      return { error: "课程表不存在或无权限删除" };
    }

    await prisma.courseTable.delete({
      where: {
        id: scheduleId,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/schedules");
    return { success: true };
  } catch (error) {
    console.error("删除课程表失败:", error);
    return { error: "删除课程表失败" };
  }
}

// 更新课程表
export async function updateSchedule(
  scheduleId: string,
  data: z.infer<typeof updateScheduleSchema>
): Promise<{ data?: Schedule; error?: string }> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return { error: "未登录" };
    }

    const validation = updateScheduleSchema.safeParse(data);
    if (!validation.success) {
      return { error: validation.error.errors[0]?.message || "数据验证失败" };
    }

    // 验证课程表是否存在且属于当前用户
    const existingSchedule = await prisma.courseTable.findUnique({
      where: {
        id: scheduleId,
        userId,
      },
    });

    if (!existingSchedule) {
      return { error: "课程表不存在或无权限修改" };
    }

    const updatedSchedule = await prisma.courseTable.update({
      where: {
        id: scheduleId,
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
    const transformedSchedule: Schedule = {
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

    revalidatePath("/dashboard");
    revalidatePath("/schedules");
    revalidatePath(`/schedules/${scheduleId}`);
    return { data: transformedSchedule };
  } catch (error) {
    console.error("更新课程表失败:", error);
    return { error: "更新课程表失败" };
  }
} 
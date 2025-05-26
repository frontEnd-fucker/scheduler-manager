"use client";

import React, { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Course, TimeSlot } from "@/components/ui/CourseTable";
import { MiniCourseTable } from "@/components/ui/MiniCourseTable";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Calendar, Clock, BookOpen, Trash2, Edit, AlertTriangle, Home, ChevronRight } from "lucide-react";
import Link from "next/link";

// 表单验证schema
const createScheduleSchema = z.object({
  name: z.string().min(1, "课程表名称不能为空").max(50, "课程表名称不能超过50个字符"),
  description: z.string().max(200, "描述不能超过200个字符").optional(),
});

type CreateScheduleForm = z.infer<typeof createScheduleSchema>;

// 课程表接口
interface Schedule {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  courses: Course[];
}

// 假数据
const mockTimeSlots: TimeSlot[] = [
  { id: 1, start: new Date(2024, 0, 1, 8, 0), end: new Date(2024, 0, 1, 8, 45) },
  { id: 2, start: new Date(2024, 0, 1, 8, 55), end: new Date(2024, 0, 1, 9, 40) },
  { id: 3, start: new Date(2024, 0, 1, 10, 0), end: new Date(2024, 0, 1, 10, 45) },
  { id: 4, start: new Date(2024, 0, 1, 10, 55), end: new Date(2024, 0, 1, 11, 40) },
  { id: 5, start: new Date(2024, 0, 1, 14, 0), end: new Date(2024, 0, 1, 14, 45) },
  { id: 6, start: new Date(2024, 0, 1, 14, 55), end: new Date(2024, 0, 1, 15, 40) },
  { id: 7, start: new Date(2024, 0, 1, 16, 0), end: new Date(2024, 0, 1, 16, 45) },
  { id: 8, start: new Date(2024, 0, 1, 16, 55), end: new Date(2024, 0, 1, 17, 40) },
];

const mockSchedules: Schedule[] = [
  {
    id: "1",
    name: "2024春季学期",
    description: "春季学期课程安排",
    createdAt: new Date(2024, 1, 15),
    updatedAt: new Date(2024, 2, 10),
    courses: [
      {
        id: "1",
        name: "高等数学",
        dayOfWeek: 2,
        timeSlotId: 2,
        startTime: new Date(2024, 0, 1, 8, 55),
        endTime: new Date(2024, 0, 1, 9, 40),
      },
      {
        id: "2",
        name: "高等数学",
        dayOfWeek: 4,
        timeSlotId: 2,
        startTime: new Date(2024, 0, 1, 8, 55),
        endTime: new Date(2024, 0, 1, 9, 40),
      },
      {
        id: "3",
        name: "大学英语",
        dayOfWeek: 1,
        timeSlotId: 5,
        startTime: new Date(2024, 0, 1, 14, 0),
        endTime: new Date(2024, 0, 1, 14, 45),
      },
      {
        id: "4",
        name: "大学英语",
        dayOfWeek: 3,
        timeSlotId: 5,
        startTime: new Date(2024, 0, 1, 14, 0),
        endTime: new Date(2024, 0, 1, 14, 45),
      },
      {
        id: "5",
        name: "大学物理",
        dayOfWeek: 2,
        timeSlotId: 6,
        startTime: new Date(2024, 0, 1, 14, 55),
        endTime: new Date(2024, 0, 1, 15, 40),
      },
      {
        id: "6",
        name: "大学物理",
        dayOfWeek: 4,
        timeSlotId: 7,
        startTime: new Date(2024, 0, 1, 16, 0),
        endTime: new Date(2024, 0, 1, 16, 45),
      },
    ],
  },
  {
    id: "2",
    name: "2024秋季学期",
    description: "秋季学期课程安排",
    createdAt: new Date(2024, 7, 20),
    updatedAt: new Date(2024, 7, 25),
    courses: [
      {
        id: "7",
        name: "计算机基础",
        dayOfWeek: 1,
        timeSlotId: 1,
        startTime: new Date(2024, 0, 1, 8, 0),
        endTime: new Date(2024, 0, 1, 8, 45),
      },
      {
        id: "8",
        name: "计算机基础",
        dayOfWeek: 3,
        timeSlotId: 1,
        startTime: new Date(2024, 0, 1, 8, 0),
        endTime: new Date(2024, 0, 1, 8, 45),
      },
      {
        id: "9",
        name: "程序设计",
        dayOfWeek: 2,
        timeSlotId: 5,
        startTime: new Date(2024, 0, 1, 14, 0),
        endTime: new Date(2024, 0, 1, 14, 45),
      },
      {
        id: "10",
        name: "程序设计",
        dayOfWeek: 4,
        timeSlotId: 5,
        startTime: new Date(2024, 0, 1, 14, 0),
        endTime: new Date(2024, 0, 1, 14, 45),
      },
    ],
  },
];

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>(mockSchedules);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [deleteSchedule, setDeleteSchedule] = useState<Schedule | null>(null);

  const form = useForm<CreateScheduleForm>({
    resolver: zodResolver(createScheduleSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const onSubmit = (data: CreateScheduleForm) => {
    const newSchedule: Schedule = {
      id: Date.now().toString(),
      name: data.name,
      description: data.description,
      createdAt: new Date(),
      updatedAt: new Date(),
      courses: [],
    };

    setSchedules([...schedules, newSchedule]);
    setIsCreateDialogOpen(false);
    form.reset();
  };

  const handleDeleteSchedule = (schedule: Schedule) => {
    setDeleteSchedule(schedule);
  };

  const confirmDelete = () => {
    if (deleteSchedule) {
      setSchedules(schedules.filter(s => s.id !== deleteSchedule.id));
      setDeleteSchedule(null);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 面包屑导航 */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center space-x-2 text-sm text-gray-600">
            <Link href="/dashboard" className="flex items-center hover:text-gray-900 transition-colors">
              <Home className="h-4 w-4 mr-1" />
              首页
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-gray-900 font-medium">课程表管理</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* 页面头部 */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">我的课程表</h1>
            <p className="text-gray-600 mt-2">管理您的所有课程表，创建新的学期安排</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2 shadow-sm">
                <Plus className="h-4 w-4" />
                新建课程表
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>新建课程表</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>课程表名称 *</FormLabel>
                        <FormControl>
                          <Input placeholder="例如：2024春季学期" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>课程表描述</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="简单描述这个课程表的用途（可选）" 
                            className="resize-none"
                            rows={3}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      取消
                    </Button>
                    <Button type="submit">创建课程表</Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* 课程表列表 */}
        {schedules.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {schedules.map((schedule) => (
              <Card key={schedule.id} className="hover:shadow-lg transition-all duration-200 cursor-pointer group border-0 shadow-sm">
                <CardHeader className="relative pb-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-3 group-hover:text-blue-600 transition-colors">
                        {schedule.name}
                      </CardTitle>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>创建：{formatDate(schedule.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>修改：{formatDate(schedule.updatedAt)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSchedule(schedule);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  {/* 课程表预览 */}
                  <div className="mb-4">
                    <MiniCourseTable
                      courses={schedule.courses}
                      timeSlots={mockTimeSlots}
                    />
                  </div>
                </CardContent>
                
                <CardFooter className="flex justify-between items-center bg-gray-50/50 border-t">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <BookOpen className="h-4 w-4" />
                    <span>{schedule.courses.length} 门课程</span>
                  </div>
                  <Button variant="outline" size="sm" className="flex items-center gap-1 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200">
                    <Edit className="h-4 w-4" />
                    编辑
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          // 空状态
          <div className="text-center py-20">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <Calendar className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">还没有课程表</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              创建您的第一个课程表，开始安排学习计划。您可以添加课程、设置时间，让学习更有条理。
            </p>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2 shadow-sm">
                  <Plus className="h-4 w-4" />
                  创建第一个课程表
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
        )}

        {/* 删除确认对话框 */}
        <Dialog open={!!deleteSchedule} onOpenChange={() => setDeleteSchedule(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                删除课程表
              </DialogTitle>
            </DialogHeader>
            {deleteSchedule && (
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-red-800">警告</h4>
                      <p className="text-sm text-red-700 mt-1">
                        此操作不可撤销。删除后，该课程表及其所有课程安排将永久丢失。
                      </p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <p className="text-gray-900">
                    您确定要删除课程表 "<strong>{deleteSchedule.name}</strong>" 吗？
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    该课程表包含 {deleteSchedule.courses.length} 门课程。
                  </p>
                </div>
                
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setDeleteSchedule(null)}
                  >
                    取消
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={confirmDelete}
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    确认删除
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
} 
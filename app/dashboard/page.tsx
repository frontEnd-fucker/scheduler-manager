"use client";

import React, { useState, useEffect, useTransition } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { MiniCourseTable } from "@/components/ui/MiniCourseTable";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Calendar, Clock, BookOpen, Trash2, Edit, AlertTriangle, Home, ChevronRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { getSchedules, createSchedule, deleteSchedule, type Schedule } from "@/app/actions/schedule-actions";

// 表单验证schema
const createScheduleSchema = z.object({
  name: z.string().min(1, "课程表名称不能为空").max(50, "课程表名称不能超过50个字符"),
  description: z.string().max(200, "描述不能超过200个字符").optional(),
});

type CreateScheduleForm = z.infer<typeof createScheduleSchema>;

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [deleteScheduleData, setDeleteScheduleData] = useState<Schedule | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<CreateScheduleForm>({
    resolver: zodResolver(createScheduleSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // 加载课程表数据
  useEffect(() => {
    const loadSchedules = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const result = await getSchedules();
        if (result.error) {
          setError(result.error);
        } else if (result.data) {
          setSchedules(result.data);
        }
      } catch (err) {
        setError('加载课程表失败');
        console.error('加载课程表失败:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSchedules();
  }, []);

  const onSubmit = async (data: CreateScheduleForm) => {
    startTransition(async () => {
      try {
        const result = await createSchedule(data);
        if (result.error) {
          form.setError("root", { message: result.error });
        } else if (result.data) {
          setSchedules(prev => [result.data!, ...prev]);
          setIsCreateDialogOpen(false);
          form.reset();
        }
      } catch (err) {
        form.setError("root", { message: "创建课程表失败" });
        console.error('创建课程表失败:', err);
      }
    });
  };

  const handleDeleteSchedule = (schedule: Schedule) => {
    setDeleteScheduleData(schedule);
    setDeleteConfirmName("");
  };

  const confirmDelete = async () => {
    if (deleteScheduleData && deleteConfirmName === deleteScheduleData.name) {
      startTransition(async () => {
        try {
          const result = await deleteSchedule(deleteScheduleData.id);
          if (result.error) {
            setError(result.error);
          } else {
            setSchedules(prev => prev.filter(s => s.id !== deleteScheduleData.id));
            setDeleteScheduleData(null);
            setDeleteConfirmName("");
          }
        } catch (err) {
          setError('删除课程表失败');
          console.error('删除课程表失败:', err);
        }
      });
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">加载课程表中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              加载失败
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">{error}</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => window.location.reload()} className="w-full">
              重新加载
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 面包屑导航 */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center space-x-2 text-sm text-gray-600">
            <Link href="/dashboard" className="flex items-center hover:text-blue-600 transition-colors">
              <Home className="h-4 w-4 mr-1" />
              首页
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-gray-900 font-medium">课程表管理</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* 工具栏 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">我的课程表</h1>
              <p className="text-gray-600">管理您的所有课程表，创建新的学期安排</p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  新建课程表
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
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
                    {form.formState.errors.root && (
                      <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                        {form.formState.errors.root.message}
                      </div>
                    )}
                    <div className="flex justify-end gap-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsCreateDialogOpen(false)}
                        disabled={isPending}
                      >
                        取消
                      </Button>
                      <Button type="submit" disabled={isPending}>
                        {isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            创建中...
                          </>
                        ) : (
                          "创建课程表"
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* 课程表列表 */}
        {schedules.length === 0 ? (
          // 空状态
          <div className="text-center py-16 bg-white rounded-lg shadow-sm">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Calendar className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">还没有课程表</h3>
            <p className="text-gray-600 mb-6">创建您的第一个课程表，开始安排学习计划</p>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  创建第一个课程表
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {schedules.map((schedule) => (
              <Card key={schedule.id} className="group hover:shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer relative">
                {/* 删除按钮 */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteSchedule(schedule);
                  }}
                  className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-white hover:bg-red-50 hover:text-red-600 shadow-sm"
                  disabled={isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>

                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2 pr-10">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                    {schedule.name}
                  </CardTitle>
                  <div className="space-y-1 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      创建时间：{formatDate(schedule.createdAt)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      最后修改：{formatDate(schedule.updatedAt)}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="py-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <MiniCourseTable courses={schedule.courses} />
                  </div>
                </CardContent>

                <CardFooter className="bg-gray-50 flex justify-between items-center">
                  <div className="text-sm text-gray-600 flex items-center gap-1">
                    <BookOpen className="h-3 w-3" />
                    {schedule._count.courses}门课程
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/schedules/${schedule.id}`}>
                      <Edit className="h-3 w-3 mr-1" />
                      编辑
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* 删除确认对话框 */}
        <AlertDialog open={!!deleteScheduleData} onOpenChange={() => setDeleteScheduleData(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>删除课程表</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-4">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-red-800 font-medium mb-2">
                      <AlertTriangle className="h-4 w-4" />
                      警告
                    </div>
                    <p className="text-red-700 text-sm">
                      此操作不可撤销。删除后，该课程表及其所有课程安排将永久丢失。
                    </p>
                  </div>
                  
                  {deleteScheduleData && (
                    <>
                      <p>
                        您确定要删除课程表 "<strong>{deleteScheduleData.name}</strong>" 吗？
                      </p>
                      <p className="text-sm text-gray-600">
                        该课程表包含 <span className="font-medium">{deleteScheduleData._count.courses}</span> 门课程。
                      </p>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          请输入课程表名称以确认删除：
                        </label>
                        <Input
                          value={deleteConfirmName}
                          onChange={(e) => setDeleteConfirmName(e.target.value)}
                          placeholder="输入课程表名称"
                          className="w-full"
                        />
                      </div>
                    </>
                  )}
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteScheduleData(null)} disabled={isPending}>
                取消
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                disabled={!deleteScheduleData || deleteConfirmName !== deleteScheduleData.name || isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    删除中...
                  </>
                ) : (
                  "确认删除"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
} 
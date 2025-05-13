"use client";
import { DndContext, DragEndEvent, DragOverlay } from "@dnd-kit/core";
import { useState } from "react";
import { Course, CourseTable } from "@/components/ui/CourseTable";
import DraggableCourses, { CourseItems } from "@/components/ui/DraggableCourses";
import { getCourseColorClasses } from "@/lib/utils";

export default function Home() {
  // 课程表数据
  const [courses, setCourses] = useState<Course[]>([]);
  // 可拖拽课程项
  const [courseItems, setCourseItems] = useState<CourseItems>([]);
  // 当前拖拽的课程id
  const [activeId, setActiveId] = useState<number | null>(null);

  // 拖拽结束时处理
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;
    // over.id: 格子id，格式 day-timeSlot
    // active.id: 课程项id
    const [dayOfWeek, timeSlotId] = (over.id as string).split("-").map(Number);
    const draggedCourse = courseItems.find((c) => c.courseNameId === Number(active.id));
    if (!draggedCourse) return;
    // 检查该格子是否已有课程
    if (courses.some((c) => c.dayOfWeek === dayOfWeek && c.timeSlotId === timeSlotId)) return;
    // 生成新课程
    setCourses([
      ...courses,
      {
        id: Date.now().toString(),
        name: draggedCourse.courseName,
        dayOfWeek: dayOfWeek as 1 | 2 | 3 | 4 | 5,
        timeSlotId,
        startTime: "",
        endTime: "",
      },
    ]);
  };

  // 处理添加新课程
  const handleAddCourse = (newCourse: { courseName: string; courseNameId: number }) => {
    setCourseItems((prev) => [...prev, newCourse]);
  };

  // 处理删除课程
  const handleDeleteCourse = (courseId: number) => {
    // 更新可拖拽课程列表
    setCourseItems((prev) => prev.filter((c) => c.courseNameId !== courseId));
    
    // 获取被删除的课程名称
    const deletedCourse = courseItems.find(c => c.courseNameId === courseId);
    if (deletedCourse) {
      // 同时从课程表中删除该课程（如果存在）
      setCourses(prev => prev.filter(c => c.name !== deletedCourse.courseName));
    }
  };

  return (
    <DndContext
      onDragStart={event => setActiveId(Number(event.active.id))}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="flex flex-col md:flex-row gap-4">
        <div>
          <DraggableCourses 
            courses={courseItems} 
            onAddCourse={handleAddCourse} 
            onDeleteCourse={handleDeleteCourse}
          />
        </div>
        <div className="flex-1">
          <CourseTable courses={courses} timeSlots={timeSlots} className="md:max-w-4xl" />
        </div>
      </div>
      <DragOverlay>
        {activeId != null ? (() => {
          const course = courseItems.find(c => c.courseNameId === activeId);
          if (!course) return null;
          return (
            <div
              className={`px-3 py-2 rounded select-none flex items-center justify-between shadow-lg ${getCourseColorClasses(course.courseName)}`}
              style={{ minWidth: 100 }}
            >
              <span className="font-medium">{course.courseName}</span>
            </div>
          );
        })() : null}
      </DragOverlay>
    </DndContext>
  );
}

const timeSlots = [
  { id: 1, start: '08:00', end: '09:30' },
  { id: 2, start: '09:30', end: '11:00' },
  { id: 3, start: '11:10', end: '12:40' },
  { id: 4, start: '12:40', end: '14:10' },
  { id: 5, start: '14:30', end: '16:00' },
  { id: 6, start: '16:10', end: '17:40' },
];

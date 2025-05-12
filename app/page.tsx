"use client";
import { DndContext, DragEndEvent, DragOverlay } from "@dnd-kit/core";
import { useState } from "react";
import { Course, CourseTable } from "@/components/ui/CourseTable";
import DraggableCourses, { CourseItems } from "@/components/ui/DraggableCourses";

export default function Home() {
  // 课程表数据
  const [courses, setCourses] = useState<Course[]>(defaultCourses);
  // 可拖拽课程项
  const [courseItems, setCourseItems] = useState<CourseItems>(defaultCourseItems);
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
    const colorList = ["blue", "green", "purple", "yellow", "red", "orange", "pink", "cyan"];
    const color = colorList[courses.length % colorList.length];
    setCourses([
      ...courses,
      {
        id: Date.now().toString(),
        name: draggedCourse.courseName,
        dayOfWeek: dayOfWeek as 1 | 2 | 3 | 4 | 5,
        timeSlotId,
        startTime: "",
        endTime: "",
        color,
      },
    ]);
  };

  return (
    <DndContext
      onDragStart={event => setActiveId(Number(event.active.id))}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="flex flex-col md:flex-row gap-4">
        <div>
          <DraggableCourses courses={courseItems} />
        </div>
        <div className="flex-1">
          <CourseTable courses={courses} timeSlots={timeSlots} className="md:max-w-4xl" />
        </div>
      </div>
      <DragOverlay>
        {activeId != null ? (() => {
          const course = courseItems.find(c => c.courseNameId === activeId);
          if (!course) return null;
          const colorClasses = [
            'bg-blue-100 border-l-4 border-blue-500',
            'bg-green-100 border-l-4 border-green-500',
            'bg-purple-100 border-l-4 border-purple-500',
            'bg-yellow-100 border-l-4 border-yellow-500',
            'bg-red-100 border-l-4 border-red-500',
          ];
          const idx = courseItems.findIndex(c => c.courseNameId === activeId);
          return (
            <div
              className={`px-3 py-2 rounded ${colorClasses[idx % colorClasses.length]} select-none flex items-center justify-between shadow-lg`}
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

// 默认课程表数据
const defaultCourses: Course[] = [
  { id: '1', name: '高等数学', dayOfWeek: 1, timeSlotId: 1, startTime: '08:00', endTime: '09:30', color: 'blue' },
  { id: '2', name: '大学英语', dayOfWeek: 1, timeSlotId: 2, startTime: '09:30', endTime: '11:00', color: 'green' },
  { id: '3', name: '线性代数', dayOfWeek: 2, timeSlotId: 3, startTime: '11:10', endTime: '12:40', color: 'red' },
  { id: '4', name: '计算机基础', dayOfWeek: 2, timeSlotId: 4, startTime: '12:40', endTime: '14:10', color: 'purple' },
  { id: '5', name: '物理实验', dayOfWeek: 3, timeSlotId: 5, startTime: '14:30', endTime: '16:00', color: 'orange' },
  { id: '6', name: '程序设计', dayOfWeek: 3, timeSlotId: 6, startTime: '16:10', endTime: '17:40', color: 'pink' },
  { id: '7', name: '大学物理', dayOfWeek: 4, timeSlotId: 1, startTime: '08:00', endTime: '09:30', color: 'cyan' },
  { id: '8', name: '思想政治', dayOfWeek: 4, timeSlotId: 2, startTime: '09:30', endTime: '11:00', color: 'yellow' },
];

// 默认可拖拽课程项
const defaultCourseItems: CourseItems = [
  { courseName: '高等数学', courseNameId: 1, isUsed: true },
  { courseName: '大学英语', courseNameId: 2, isUsed: false },
  { courseName: '计算机基础', courseNameId: 3, isUsed: false },
  { courseName: '物理学', courseNameId: 4, isUsed: false },
  { courseName: '程序设计', courseNameId: 5, isUsed: true },
];

const timeSlots = [
  { id: 1, start: '08:00', end: '09:30' },
  { id: 2, start: '09:30', end: '11:00' },
  { id: 3, start: '11:10', end: '12:40' },
  { id: 4, start: '12:40', end: '14:10' },
  { id: 5, start: '14:30', end: '16:00' },
  { id: 6, start: '16:10', end: '17:40' },
];

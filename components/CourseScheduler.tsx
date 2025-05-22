"use client";
import { DndContext, DragEndEvent, DragOverlay } from "@dnd-kit/core";
import { useState, useEffect } from "react";
import { Course, CourseTable } from "@/components/ui/CourseTable";
import DraggableCourses, { CourseItems } from "@/components/ui/DraggableCourses";
import { getCourseColorClasses } from "@/lib/utils";
import { useCreateCourse, useCreateCourseItem, useDeleteCourseItem } from "@/app/hooks/useCourseActions";
import { useQueryClient, HydrationBoundary, dehydrate, QueryClient } from "@tanstack/react-query";

interface TimeSlot {
  id: number;
  start: Date;
  end: Date;
}

// Mock user ID - In a real app, this would come from authentication context
const MOCK_USER_ID = "user_123456789";

interface CourseSchedulerProps {
  timeSlots: TimeSlot[];
  courseItems: CourseItems;
  courses: Course[];
  tableId: string;
}

export function CourseScheduler({ courseItems: initialCourseItems, timeSlots, courses: initialCourses, tableId }: CourseSchedulerProps) {
  
  // 使用本地state维护courses和courseItems
  const [localCourses, setLocalCourses] = useState<Course[]>(initialCourses);
  const [localCourseItems, setLocalCourseItems] = useState<CourseItems>(initialCourseItems);
  
  // 当父组件传入的props变化时，更新本地state
  useEffect(() => {
    setLocalCourses(initialCourses);
  }, [initialCourses]);
  
  useEffect(() => {
    setLocalCourseItems(initialCourseItems);
  }, [initialCourseItems]);

  // Mutations
  const createCourseMutation = useCreateCourse();
  const createCourseItemMutation = useCreateCourseItem();
  const deleteCourseItemMutation = useDeleteCourseItem();

  // Current dragged course id
  const [activeId, setActiveId] = useState<string | null>(null);

  // Drag end handler
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;
    
    // over.id: cell id, format: day-timeSlot
    // active.id: course item id
    const [dayOfWeek, timeSlotId] = (over.id as string).split("-").map(Number);
    const draggedCourseItem = localCourseItems.find((c) => c.id === active.id);
    
    if (!draggedCourseItem) return;
    
    // Check if there's already a course in this cell
    if (localCourses.some((c) => c.dayOfWeek === dayOfWeek && c.timeSlotId === timeSlotId)) return;
    
    // 创建乐观更新的临时ID
    const optimisticId = `temp-${Date.now()}`;
    
    // 从timeSlots中获取对应的时间段
    const timeSlot = timeSlots.find(ts => ts.id === timeSlotId);
    
    // 创建乐观更新的课程对象
    const optimisticCourse: Course = {
      id: optimisticId,
      name: draggedCourseItem.courseName,
      dayOfWeek: dayOfWeek as 1 | 2 | 3 | 4 | 5,
      timeSlotId,
      startTime: timeSlot ? timeSlot.start : new Date(),
      endTime: timeSlot ? timeSlot.end : new Date()
    };
    
    // 直接更新本地state实现乐观更新
    setLocalCourses(prevCourses => [...prevCourses, optimisticCourse]);
    
    try {
      // Create new course using mutation
      createCourseMutation.mutate({
        tableId,
        name: draggedCourseItem.courseName,
        dayOfWeek,
        timeSlotId,
        userId: MOCK_USER_ID
      });
    } catch (err) {
      // 如果失败，回滚乐观更新
      setLocalCourses(prevCourses => prevCourses.filter(c => c.id !== optimisticId));
      console.error("Error creating course:", err);
    }
  };

  // Add new course handler
  const handleAddCourse = async (newCourse: { courseName: string; id: string }) => {
    // 乐观更新本地courseItems
    setLocalCourseItems(prevItems => [...prevItems, { 
      id: `temp-${Date.now()}`, 
      courseName: newCourse.courseName 
    }]);
    
    try {
      // Create new course item using mutation
      createCourseItemMutation.mutate({
        tableId,
        courseName: newCourse.courseName,
        userId: MOCK_USER_ID
      });
    } catch (err) {
      // 回滚乐观更新
      setLocalCourseItems(prevItems => 
        prevItems.filter(item => item.courseName !== newCourse.courseName)
      );
      console.error("Error adding course:", err);
    }
  };

  // Delete course handler
  const handleDeleteCourse = async (courseId: string) => {
    // 找到要删除的课程
    const courseToDelete = localCourseItems.find(c => c.id === courseId);
    if (!courseToDelete) return;
    
    // 乐观更新
    setLocalCourseItems(prevItems => prevItems.filter(item => item.id !== courseId));
    
    try {
      // Delete course item using mutation
      deleteCourseItemMutation.mutate({
        tableId,
        courseId,
        userId: MOCK_USER_ID
      });
    } catch (err) {
      // 回滚乐观更新
      if (courseToDelete) {
        setLocalCourseItems(prevItems => [...prevItems, courseToDelete]);
      }
      console.error("Error deleting course:", err);
    }
  };

  return (
    <DndContext
      onDragStart={event => setActiveId(event.active.id as string)}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="flex flex-col md:flex-row gap-4">
        <div>
          <DraggableCourses 
            courses={localCourseItems} 
            onAddCourse={handleAddCourse} 
            onDeleteCourse={handleDeleteCourse}
          />
        </div>
        <div className="flex-1">
          <CourseTable courses={localCourses} timeSlots={timeSlots} className="md:max-w-4xl" />
        </div>
      </div>
      <DragOverlay>
        {activeId != null ? (() => {
          const course = localCourseItems.find(c => c.id === activeId);
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
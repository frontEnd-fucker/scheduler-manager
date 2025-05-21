"use client";
import { DndContext, DragEndEvent, DragOverlay } from "@dnd-kit/core";
import { useState } from "react";
import { Course, CourseTable } from "@/components/ui/CourseTable";
import DraggableCourses, { CourseItems } from "@/components/ui/DraggableCourses";
import { getCourseColorClasses } from "@/lib/utils";
import { useCourseTable } from "./hooks/useCourseTable";
import { useCreateCourse, useCreateCourseItem, useDeleteCourseItem } from "./hooks/useCourseActions";

// Mock user ID - In a real app, this would come from authentication
const MOCK_USER_ID = "user_123456789";
// Mock course table ID - In a real app, this would be selected by the user
const MOCK_TABLE_ID = "table_123456789";

export default function Home() {
  // Current dragged course id
  const [activeId, setActiveId] = useState<number | null>(null);

  // Fetch course table data using React Query
  const { 
    data, 
    isLoading, 
    error: queryError,
  } = useCourseTable(MOCK_TABLE_ID, MOCK_USER_ID);

  // Mutations
  const createCourseMutation = useCreateCourse();
  const createCourseItemMutation = useCreateCourseItem();
  const deleteCourseItemMutation = useDeleteCourseItem();

  // Drag end handler
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || !data) return;
    
    // over.id: cell id, format: day-timeSlot
    // active.id: course item id
    const [dayOfWeek, timeSlotId] = (over.id as string).split("-").map(Number);
    const draggedCourseItem = data.courseItems.find((c) => c.courseNameId === active.id);
    
    if (!draggedCourseItem) return;
    
    // Check if there's already a course in this cell
    if (data.courses.some((c) => c.dayOfWeek === dayOfWeek && c.timeSlotId === timeSlotId)) return;
    
    try {
      // Create new course using mutation
      createCourseMutation.mutate({
        tableId: MOCK_TABLE_ID,
        name: draggedCourseItem.courseName,
        dayOfWeek,
        timeSlotId,
        userId: MOCK_USER_ID
      });
    } catch (err) {
      console.error("Error creating course:", err);
    }
  };

  // Add new course handler
  const handleAddCourse = async (newCourse: { courseName: string; courseNameId: number }) => {
    try {
      // Create new course item using mutation
      createCourseItemMutation.mutate({
        tableId: MOCK_TABLE_ID,
        courseName: newCourse.courseName,
        userId: MOCK_USER_ID
      });
    } catch (err) {
      console.error("Error adding course:", err);
    }
  };

  // Delete course handler
  const handleDeleteCourse = async (courseId: number) => {
    try {
      // Delete course item using mutation
      deleteCourseItemMutation.mutate({
        tableId: MOCK_TABLE_ID,
        courseId: courseId.toString(),
        userId: MOCK_USER_ID
      });
    } catch (err) {
      console.error("Error deleting course:", err);
    }
  };

  // Handle loading and error states
  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (queryError || !data) {
    return <div className="flex justify-center items-center h-screen text-red-500">
      {queryError instanceof Error ? queryError.message : "Failed to load course data. Please try again."}
    </div>;
  }

  return (
    <DndContext
      onDragStart={event => setActiveId(Number(event.active.id))}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="flex flex-col md:flex-row gap-4">
        <div>
          <DraggableCourses 
            courses={data.courseItems} 
            onAddCourse={handleAddCourse} 
            onDeleteCourse={handleDeleteCourse}
          />
        </div>
        <div className="flex-1">
          <CourseTable courses={data.courses} timeSlots={data.timeSlots} className="md:max-w-4xl" />
        </div>
      </div>
      <DragOverlay>
        {activeId != null ? (() => {
          const course = data.courseItems.find(c => c.courseNameId === activeId);
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

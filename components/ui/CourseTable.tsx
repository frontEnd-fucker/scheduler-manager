import React from "react";
import { useDroppable } from '@dnd-kit/core';
import { getCourseColorClasses } from "@/lib/utils";

export interface Course {
  id: string;
  name: string;
  dayOfWeek: 1 | 2 | 3 | 4 | 5;
  timeSlotId: number;
  startTime: string;
  endTime: string;
}

export interface TimeSlot {
  id: number;
  start: string;
  end: string;
}

export interface CourseTableProps {
  courses: Course[];
  timeSlots: TimeSlot[];
  onCourseAdd?: (course: Omit<Course, "id">) => void;
  onCourseUpdate?: (course: Course) => void;
  onCourseDelete?: (courseId: string) => void;
  config?: {
    showTimeColumn?: boolean;
    showLunchBreak?: boolean;
  };
  className?: string;
  style?: React.CSSProperties;
}

const dayNames = ["周一", "周二", "周三", "周四", "周五"];

// 创建单独的可放置单元格组件
const DroppableCell = ({ 
  day, 
  timeSlot, 
  course, 
  onCourseDelete 
}: { 
  day: number; 
  timeSlot: number; 
  course?: Course; 
  onCourseDelete?: (courseId: string) => void;
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `${day}-${timeSlot}`,
  });

  return (
    <div
      ref={setNodeRef}
      className={`bg-white min-h-[56px] relative group schedule-cell border border-gray-100 flex items-center justify-center transition-colors ${isOver ? 'ring-2 ring-blue-400 bg-blue-50' : ''}`}
      data-day={day}
      data-time={timeSlot}
    >
      {course ? (
        <div className="w-full h-full p-1 flex items-center justify-center">
          <div
            className={`group relative course-item px-4 py-3 select-none flex items-center justify-between w-full h-full ${getCourseColorClasses(course.name)} rounded-r-sm`}
            draggable
            // onDragStart/onDragEnd handlers can be added here
          >
            <span className="font-medium text-base">{course.name}</span>
            {onCourseDelete && (
              <button
                type="button"
                className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-100 hover:cursor-pointer"
                onClick={() => onCourseDelete(course.id)}
                tabIndex={-1}
                aria-label="删除课程"
              >
                <span className="w-4 h-4 text-red-400 hover:text-red-600 inline-block align-middle">×</span>
              </button>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export const CourseTable: React.FC<CourseTableProps> = ({
  courses,
  timeSlots,
  onCourseAdd,
  onCourseUpdate,
  onCourseDelete,
  config = { showTimeColumn: true, showLunchBreak: true },
  className = "",
  style,
}) => {
  // 午休分割线在第4节后
  const lunchBreakAfter = 4;

  return (
    <div className={`w-full ${className}`} style={style}>
      <div className="grid grid-cols-6 gap-px bg-gray-200 border border-gray-200 rounded-lg overflow-hidden">
        {/* 表头 */}
        {config.showTimeColumn && <div className="bg-white p-2 font-semibold text-center" />}
        {dayNames.map((d) => (
          <div key={d} className="bg-white p-2 font-semibold text-center">
            {d}
          </div>
        ))}
        {/* 时间槽和课程格子 */}
        {timeSlots.map((slot, slotIdx) => (
          <React.Fragment key={slot.id}>
            {config.showTimeColumn && (
              <div className="bg-white p-2 text-xs text-gray-500 flex flex-col items-center justify-center border-r border-gray-100">
                <p>
                  <span>{slot.start}</span>
                  <span className="text-gray-300">-</span>
                  <span>{slot.end}</span>
                </p>
              </div>
            )}
            {dayNames.map((_, dayIdx) => {
              const course = courses.find(
                (c) => c.dayOfWeek === dayIdx + 1 && c.timeSlotId === slot.id
              );
              return (
                <DroppableCell
                  key={dayIdx}
                  day={dayIdx + 1}
                  timeSlot={slot.id}
                  course={course}
                  onCourseDelete={onCourseDelete}
                />
              );
            })}
            {/* 午休分割线 */}
            {config.showLunchBreak && slotIdx + 1 === lunchBreakAfter && (
              <div className="col-span-6 bg-gray-50 text-center text-xs text-gray-400 py-1 border-b border-gray-200">
                午休时间
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default CourseTable; 
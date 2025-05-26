import React from "react";
import { Course, TimeSlot } from "./CourseTable";
import { getCourseColorStyle } from "@/lib/utils";

interface MiniCourseTableProps {
  courses: Course[];
  timeSlots: TimeSlot[];
  className?: string;
}

const dayNames = ["一", "二", "三", "四", "五"];

export const MiniCourseTable: React.FC<MiniCourseTableProps> = ({
  courses,
  timeSlots,
  className = "",
}) => {
  // 只显示前4个时间段，简化预览
  const previewTimeSlots = timeSlots.slice(0, 4);

  const getCourseDisplayColor = (courseName: string) => {
    const colors = getCourseColorStyle(courseName);
    // 将浅色背景转换为深色背景用于显示
    const colorMap: { [key: string]: string } = {
      'bg-blue-100': 'bg-blue-500',
      'bg-green-100': 'bg-green-500',
      'bg-red-100': 'bg-red-500',
      'bg-purple-100': 'bg-purple-500',
      'bg-orange-100': 'bg-orange-500',
      'bg-pink-100': 'bg-pink-500',
      'bg-cyan-100': 'bg-cyan-500',
      'bg-yellow-100': 'bg-yellow-500',
      'bg-gray-100': 'bg-gray-500',
    };
    return colorMap[colors.bg] || 'bg-gray-500';
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="grid grid-cols-5 gap-0.5 bg-gray-200 rounded-md overflow-hidden">
        {/* 星期头部 */}
        {dayNames.map((day) => (
          <div
            key={day}
            className="bg-gray-100 text-center text-xs font-medium text-gray-600 py-1"
          >
            {day}
          </div>
        ))}
        
        {/* 时间段和课程 */}
        {previewTimeSlots.map((slot) => (
          dayNames.map((_, dayIdx) => {
            const course = courses.find(
              (c) => c.dayOfWeek === dayIdx + 1 && c.timeSlotId === slot.id
            );
            
            return (
              <div
                key={`${dayIdx}-${slot.id}`}
                className="bg-white h-6 relative flex items-center justify-center"
              >
                {course && (
                  <div
                    className={`absolute inset-0 flex items-center justify-center text-xs font-medium text-white rounded-sm ${getCourseDisplayColor(course.name)}`}
                  >
                    <span className="truncate px-1">{course.name}</span>
                  </div>
                )}
              </div>
            );
          })
        ))}
      </div>
    </div>
  );
};

export default MiniCourseTable; 
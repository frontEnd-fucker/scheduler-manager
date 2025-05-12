import { Course, CourseTable } from "@/components/ui/CourseTable";
import DraggableCourses from "@/components/ui/DraggableCourses";


export default function Home() {
  return (
    <div>
      <CourseTable courses={courses} timeSlots={timeSlots} className="md:max-w-4xl" />
      <DraggableCourses />
    </div>
  );
}

const courses: Course[] = [
  { id: '1', name: '高等数学', dayOfWeek: 1, timeSlotId: 1, startTime: '08:00', endTime: '09:30', color: 'blue' },
  { id: '2', name: '大学英语', dayOfWeek: 1, timeSlotId: 2, startTime: '09:30', endTime: '11:00', color: 'green' },
  { id: '3', name: '线性代数', dayOfWeek: 2, timeSlotId: 3, startTime: '11:10', endTime: '12:40', color: 'red' },
  { id: '4', name: '计算机基础', dayOfWeek: 2, timeSlotId: 4, startTime: '12:40', endTime: '14:10', color: 'purple' },
  { id: '5', name: '物理实验', dayOfWeek: 3, timeSlotId: 5, startTime: '14:30', endTime: '16:00', color: 'orange' },
  { id: '6', name: '程序设计', dayOfWeek: 3, timeSlotId: 6, startTime: '16:10', endTime: '17:40', color: 'pink' },
  { id: '7', name: '大学物理', dayOfWeek: 4, timeSlotId: 1, startTime: '08:00', endTime: '09:30', color: 'cyan' },
  { id: '8', name: '思想政治', dayOfWeek: 4, timeSlotId: 2, startTime: '09:30', endTime: '11:00', color: 'yellow' },
];

const timeSlots = [
  { id: 1, start: '08:00', end: '09:30' },
  { id: 2, start: '09:30', end: '11:00' },
  { id: 3, start: '11:10', end: '12:40' },
  { id: 4, start: '12:40', end: '14:10' },
  { id: 5, start: '14:30', end: '16:00' },
  { id: 6, start: '16:10', end: '17:40' },
];

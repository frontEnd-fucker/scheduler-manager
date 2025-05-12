"use client"
import { useState } from 'react';
import { ExclamationCircleIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Input } from './input';
import { Button } from './button';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from './alert-dialog';

export type CourseItems = Array<{
  courseName: string;
  courseNameId: number;
  isUsed?: boolean;
}>;

// 假数据
const mockCourses: CourseItems = [
  { courseName: '高等数学', courseNameId: 1, isUsed: true },
  { courseName: '大学英语', courseNameId: 2, isUsed: false },
  { courseName: '计算机基础', courseNameId: 3, isUsed: false },
  { courseName: '物理学', courseNameId: 4, isUsed: false },
  { courseName: '程序设计', courseNameId: 5, isUsed: true },
];

interface DraggableCoursesProps {
  courses?: CourseItems;
  onAddCourse?: (course: { courseName: string; courseNameId: number }) => void;
}

const colorClasses = [
  'bg-blue-100 border-l-4 border-blue-500',
  'bg-green-100 border-l-4 border-green-500',
  'bg-purple-100 border-l-4 border-purple-500',
  'bg-yellow-100 border-l-4 border-yellow-500',
  'bg-red-100 border-l-4 border-red-500',
];

export const DraggableCourses: React.FC<DraggableCoursesProps> = ({ courses = mockCourses, onAddCourse }: DraggableCoursesProps) => {
  const [courseList, setCourseList] = useState<CourseItems>(courses);
  const [newCourseName, setNewCourseName] = useState('');
  const [error, setError] = useState('');
  const [pendingDelete, setPendingDelete] = useState<number|null>(null);

  const handleAddCourse = () => {
    const name = newCourseName.trim();
    if (!name) return;
    if (courseList.some((c: { courseName: string }) => c.courseName === name)) {
      setError('不可添加重复课程');
      return;
    }
    const newCourse = {
      courseName: name,
      courseNameId: Date.now(),
    };
    setCourseList((prev: CourseItems) => [...prev, newCourse]);
    setNewCourseName('');
    setError('');
    onAddCourse?.(newCourse);
  };

  const handleDelete = (courseId: number) => {
    setCourseList((prev) => prev.filter((c) => c.courseNameId !== courseId));
    setPendingDelete(null);
  };

  const handleDeleteClick = (course: { courseNameId: number; isUsed?: boolean }) => {
    if (course.isUsed) {
      setPendingDelete(course.courseNameId);
    } else {
      handleDelete(course.courseNameId);
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4 max-w-xs w-full">
      <h2 className="text-base font-semibold mb-2">可拖拽课程</h2>
      <div className="flex flex-col gap-2 mb-4" data-testid="draggable-courses-list">
        {courseList.map((course, idx) => (
          <div
            key={course.courseNameId}
            className={`group relative course-item px-3 py-2 rounded ${colorClasses[idx % colorClasses.length]} select-none flex items-center justify-between`}
          >
            <span className="font-medium">{course.courseName}</span>
            <button
              type="button"
              className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-100 hover:cursor-pointer"
              onClick={() => handleDeleteClick(course)}
              tabIndex={-1}
              aria-label="删除课程"
            >
              <TrashIcon className="w-4 h-4 text-red-400 hover:text-red-600" />
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2 items-center">
        <Input
          type="text"
          className="flex-1 text-sm"
          placeholder="输入课程名称"
          value={newCourseName}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setNewCourseName(e.target.value);
            if (error) setError('');
          }}
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') handleAddCourse();
          }}
        />
        <Button
          className="px-3 py-1 text-sm hover:cursor-pointer"
          onClick={handleAddCourse}
        >
          新建
        </Button>
      </div>
      {error && (
        <div className="flex items-center text-xs text-red-500 mt-1 transition-opacity duration-200">
          <ExclamationCircleIcon className="w-4 h-4 mr-1" />
          <span>{error}</span>
        </div>
      )}
      {/* 删除确认弹窗 */}
      <AlertDialog open={pendingDelete !== null} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除课程？</AlertDialogTitle>
            <AlertDialogDescription>
              该课程已被使用，删除前请确认是否继续。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingDelete(null)}>取消</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleDelete(pendingDelete!)}>确认删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DraggableCourses; 
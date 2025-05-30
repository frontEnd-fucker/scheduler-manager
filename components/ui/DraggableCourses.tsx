"use client"
import { useState } from 'react';
import { ExclamationCircleIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Input } from './input';
import { Button } from './button';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from './alert-dialog';
import { useDraggable } from '@dnd-kit/core';
import { getCourseColorClasses } from '@/lib/utils';

export type CourseItems = Array<{
  courseName: string;
  id: string;
  isUsed?: boolean;
}>;

// 创建单独的可拖拽课程项组件
const DraggableCourseItem = ({ 
  course, 
  onDeleteClick 
}: { 
  course: { courseName: string; id: string; isUsed?: boolean };
  onDeleteClick: (course: { id: string; isUsed?: boolean }) => void;
}) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: course.id,
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`group relative course-item px-3 py-2 rounded select-none flex items-center justify-between transition-shadow ${getCourseColorClasses(course.courseName)} ${isDragging ? 'ring-2 ring-blue-400 shadow-lg opacity-80' : ''}`}
      style={{ cursor: 'grab', opacity: isDragging ? 0.5 : 1 }}
    >
      <span className="font-medium">{course.courseName}</span>
      <button
        type="button"
        className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-100 hover:cursor-pointer"
        onClick={() => {
          onDeleteClick(course);
        }}
        onPointerDown={(e) => {
          e.stopPropagation();
        }}
        tabIndex={-1}
        aria-label="删除课程"
      >
        <TrashIcon className="w-4 h-4 text-red-400 hover:text-red-600" />
      </button>
    </div>
  );
};

interface DraggableCoursesProps {
  courses: CourseItems;
  onAddCourse?: (course: { courseName: string; id: string }) => void;
  onDeleteCourse?: (courseId: string) => void;
}

export const DraggableCourses: React.FC<DraggableCoursesProps> = ({ 
  courses, 
  onAddCourse, 
  onDeleteCourse 
}: DraggableCoursesProps) => {
  const [newCourseName, setNewCourseName] = useState('');
  const [error, setError] = useState('');
  const [pendingDelete, setPendingDelete] = useState<string|null>(null);

  const handleAddCourse = () => {
    const name = newCourseName.trim();
    if (!name) return;
    if (courses.some((c: { courseName: string }) => c.courseName === name)) {
      setError('不可添加重复课程');
      return;
    }
    const newCourse = {
      courseName: name,
      id: Date.now().toString(),
    };
    setNewCourseName('');
    setError('');
    onAddCourse?.(newCourse);
  };

  const handleDelete = (courseId: string) => {
    setPendingDelete(null);
    onDeleteCourse?.(courseId);
  };

  const handleDeleteClick = (course: { id: string; isUsed?: boolean }) => {
    if (course.isUsed) {
      setPendingDelete(course.id);
    } else {
      handleDelete(course.id);
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4 max-w-xs w-full">
      <h2 className="text-base font-semibold mb-2">可拖拽课程</h2>
      <div className="flex flex-col gap-2 mb-4" data-testid="draggable-courses-list">
        {courses.map((course) => (
          <DraggableCourseItem 
            key={course.id}
            course={course}
            onDeleteClick={handleDeleteClick}
          />
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
      <AlertDialog 
        open={pendingDelete !== null} 
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除课程？</AlertDialogTitle>
            <AlertDialogDescription>
              该课程已被使用，删除前请确认是否继续。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingDelete(null)}>取消</AlertDialogCancel>
            <AlertDialogAction onClick={() => pendingDelete !== null && handleDelete(pendingDelete)}>
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DraggableCourses; 
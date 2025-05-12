import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 颜色映射表，用于为每个课程分配固定颜色
 */
export const colorMap: { 
  [key: string]: { bg: string; border: string } 
} = {
  "高等数学": { bg: "bg-blue-100", border: "border-blue-500" },
  "大学英语": { bg: "bg-green-100", border: "border-green-500" },
  "线性代数": { bg: "bg-red-100", border: "border-red-500" },
  "计算机基础": { bg: "bg-purple-100", border: "border-purple-500" },
  "物理实验": { bg: "bg-orange-100", border: "border-orange-500" },
  "程序设计": { bg: "bg-pink-100", border: "border-pink-500" },
  "大学物理": { bg: "bg-cyan-100", border: "border-cyan-500" },
  "思想政治": { bg: "bg-yellow-100", border: "border-yellow-500" },
  // 默认颜色，用于未在映射表中的课程
  "default": { bg: "bg-gray-100", border: "border-gray-300" }
};

/**
 * 获取课程颜色样式
 * @param courseName 课程名称
 * @returns 包含背景色和边框颜色的对象
 */
export function getCourseColorStyle(courseName: string): { bg: string; border: string } {
  return colorMap[courseName] || colorMap.default;
}

/**
 * 获取课程颜色类名
 * @param courseName 课程名称
 * @returns 组合的CSS类名字符串
 */
export function getCourseColorClasses(courseName: string): string {
  const colors = getCourseColorStyle(courseName);
  return `${colors.bg} border-l-4 ${colors.border}`;
}

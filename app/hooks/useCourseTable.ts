'use client'

import { useQuery } from '@tanstack/react-query'
import { getCourseTable } from '@/app/actions/course-table-actions'
import { formatTime } from '@/app/hooks/useTimeFormatting'

// Types
export interface TimeSlot {
  id: number
  start: string
  end: string
}

export interface CourseItem {
  courseName: string
  id: string
  isUsed: boolean
}

export interface CourseData {
  id: string
  name: string
  dayOfWeek: 1 | 2 | 3 | 4 | 5
  timeSlotId: number
  startTime: string
  endTime: string
}

export function useCourseTable(tableId: string, userId: string) {
  return useQuery({
    queryKey: ['courseTable', tableId, userId],
    queryFn: async () => {
      const courseTable = await getCourseTable(tableId, userId)
      
      // Transform data to the expected format
      const formattedTimeSlots = courseTable.timeSlots.map(slot => ({
        id: slot.id,
        start: formatTime(slot.start),
        end: formatTime(slot.end)
      }))
      
      const formattedCourseItems = courseTable.courseItems.map(item => ({
        courseName: item.courseName,
        id: item.id,
        isUsed: item.isUsed
      }))
      
      const formattedCourses = courseTable.courses.map(course => ({
        id: course.id,
        name: course.name,
        dayOfWeek: course.dayOfWeek as 1 | 2 | 3 | 4 | 5,
        timeSlotId: course.timeSlotId,
        startTime: '',
        endTime: ''
      }))
      
      return {
        timeSlots: formattedTimeSlots,
        courseItems: formattedCourseItems, 
        courses: formattedCourses
      }
    }
  })
} 
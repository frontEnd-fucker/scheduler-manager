'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createCourse } from '@/app/actions/course-actions'
import { createCourseItem, deleteCourseItem } from '@/app/actions/course-item-actions'
import { CourseData, CourseItem } from './useCourseTable'

export function useCreateCourse() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ 
      tableId, 
      name, 
      dayOfWeek, 
      timeSlotId, 
      userId 
    }: { 
      tableId: string, 
      name: string, 
      dayOfWeek: number, 
      timeSlotId: number, 
      userId: string 
    }) => {
      const result = await createCourse(
        tableId,
        { name, dayOfWeek, timeSlotId },
        userId
      )
      
      if (result.error || !result.data) {
        throw new Error(result.error ? JSON.stringify(result.error) : 'Failed to create course')
      }
      
      return {
        id: result.data.id,
        name: result.data.name,
        dayOfWeek: result.data.dayOfWeek as 1 | 2 | 3 | 4 | 5,
        timeSlotId: result.data.timeSlotId,
        startTime: '',
        endTime: '',
      }
    },
    onSuccess: (newCourse, variables) => {
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['courseTable', variables.tableId, variables.userId] })
    }
  })
}

export function useCreateCourseItem() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ 
      tableId, 
      courseName, 
      userId 
    }: { 
      tableId: string, 
      courseName: string, 
      userId: string 
    }) => {
      const result = await createCourseItem(
        tableId,
        { courseName },
        userId
      )
      
      if (result.error || !result.data) {
        throw new Error(result.error ? JSON.stringify(result.error) : 'Failed to create course item')
      }
      
      return {
        courseName: result.data.courseName,
        courseNameId: parseInt(result.data.id),
        isUsed: result.data.isUsed,
      }
    },
    onSuccess: (_, variables) => {
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['courseTable', variables.tableId, variables.userId] })
    }
  })
}

export function useDeleteCourseItem() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ 
      tableId, 
      courseId, 
      userId 
    }: { 
      tableId: string, 
      courseId: string, 
      userId: string 
    }) => {
      const result = await deleteCourseItem(
        tableId,
        courseId,
        userId,
        true // Force delete
      )
      
      if (result.error) {
        throw new Error(result.error ? JSON.stringify(result.error) : 'Failed to delete course item')
      }
      
      return { courseId }
    },
    onSuccess: (_, variables) => {
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['courseTable', variables.tableId, variables.userId] })
    }
  })
} 
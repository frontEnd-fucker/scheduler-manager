import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getCourseTable } from '@/app/actions/course-table-actions'
import { CourseScheduler } from '@/components/CourseScheduler'

// Mock course table ID - In a real app, this would be selected by the user
const MOCK_TABLE_ID = "table_123456789"

export default async function DashboardPage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }

  try {
    // Fetch course table data directly on the server using the authenticated user ID
    const courseTable = await getCourseTable(MOCK_TABLE_ID, 'user_123456789')
    
    // Transform data to match CourseData type by adding startTime and endTime
    const transformedCourses = courseTable.courses.map(course => {
      const timeSlot = courseTable.timeSlots.find(slot => slot.id === course.timeSlotId)
      return {
        ...course,
        startTime: timeSlot?.start || new Date(), // Provide default Date
        endTime: timeSlot?.end || new Date()     // Provide default Date
      }
    })

    // Pass data to client component with flattened props structure
    return (
      <div className="container mx-auto px-4 py-8">
        <CourseScheduler 
          timeSlots={courseTable.timeSlots}
          courseItems={courseTable.courseItems}
          courses={transformedCourses}
          tableId={MOCK_TABLE_ID} 
        />
      </div>
    )
  } catch (error) {
    return (
      <div className="flex justify-center items-center h-screen text-red-500">
        {error instanceof Error ? error.message : "Failed to load course data. Please try again."}
      </div>
    )
  }
} 
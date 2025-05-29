import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getCourseTable } from '@/app/actions/course-table-actions'
import { CourseScheduler } from '@/components/CourseScheduler'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Plus, BookOpen } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage({ params }: { params: { id: string } }) {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }

  try {
    // Fetch course table data directly on the server using the authenticated user ID
    const courseTable = await getCourseTable(params.id, userId)
    
    // Transform data to match CourseData type by adding startTime and endTime
    const transformedCourses = courseTable.courses.map(course => {
      const timeSlot = courseTable.timeSlots.find(slot => slot.id === course.timeSlotId)
      return {
        ...course,
        startTime: timeSlot?.start || new Date(), // Provide default Date
        endTime: timeSlot?.end || new Date()     // Provide default Date
      }
    })

    // 使用UserInit组件包装dashboard内容
    return (
      <div className="container mx-auto px-4 py-8">
        {/* 导航卡片 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">课程管理系统</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  课程表管理
                </CardTitle>
                <CardDescription>
                  管理您的所有课程表，创建新的学期安排
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/dashboard/schedules">
                  <Button className="w-full">
                    <BookOpen className="h-4 w-4 mr-2" />
                    查看课程表
                  </Button>
                </Link>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5 text-green-600" />
                  快速创建
                </CardTitle>
                <CardDescription>
                  快速创建新的课程表或添加课程
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/dashboard/schedules">
                  <Button variant="outline" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    新建课程表
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 课程编辑器 */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-4">课程编辑器</h2>
          <CourseScheduler 
            timeSlots={courseTable.timeSlots}
            courseItems={courseTable.courseItems}
            courses={transformedCourses}
            tableId={params.id} 
          />
        </div>
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
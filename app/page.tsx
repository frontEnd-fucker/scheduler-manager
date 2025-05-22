import { getCourseTable } from '@/app/actions/course-table-actions';
import { CourseScheduler } from '../components/CourseScheduler';

// Mock user ID - In a real app, this would come from authentication
const MOCK_USER_ID = "user_123456789";
// Mock course table ID - In a real app, this would be selected by the user
const MOCK_TABLE_ID = "table_123456789";

export default async function Home() {
  try {
    // Fetch course table data directly on the server
    const courseTable = await getCourseTable(MOCK_TABLE_ID, MOCK_USER_ID);
    // Transform data to match CourseData type by adding startTime and endTime
    const transformedCourses = courseTable.courses.map(course => {
      const timeSlot = courseTable.timeSlots.find(slot => slot.id === course.timeSlotId);
      return {
        ...course,
        startTime: timeSlot?.start || new Date(), // Provide default Date
        endTime: timeSlot?.end || new Date()     // Provide default Date
      };
    });

    // Pass data to client component with flattened props structure
    return <CourseScheduler 
      timeSlots={courseTable.timeSlots}
      courseItems={courseTable.courseItems}
      courses={transformedCourses}
      tableId={MOCK_TABLE_ID} 
    />;
  } catch (error) {
    return (
      <div className="flex justify-center items-center h-screen text-red-500">
        {error instanceof Error ? error.message : "Failed to load course data. Please try again."}
      </div>
    );
  }
}

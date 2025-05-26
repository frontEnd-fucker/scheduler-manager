import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { SignInButton, SignUpButton } from '@clerk/nextjs'

export default async function Home() {
  const { userId } = await auth()
  
  if (userId) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            Welcome to Course Manager
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Organize your courses, manage your schedule, and stay on top of your academic journey.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <SignInButton mode="modal">
              <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition duration-200">
                Sign In
              </button>
            </SignInButton>
            
            <SignUpButton mode="modal">
              <button className="bg-white hover:bg-gray-50 text-blue-600 font-semibold py-3 px-8 rounded-lg border-2 border-blue-600 transition duration-200">
                Sign Up
              </button>
            </SignUpButton>
          </div>
          
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-blue-600 text-3xl mb-4">📅</div>
              <h3 className="text-lg font-semibold mb-2">Schedule Management</h3>
              <p className="text-gray-600">Easily organize and view your course schedule in an intuitive interface.</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-blue-600 text-3xl mb-4">📚</div>
              <h3 className="text-lg font-semibold mb-2">Course Tracking</h3>
              <p className="text-gray-600">Keep track of all your courses, assignments, and important deadlines.</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-blue-600 text-3xl mb-4">🎯</div>
              <h3 className="text-lg font-semibold mb-2">Goal Setting</h3>
              <p className="text-gray-600">Set academic goals and monitor your progress throughout the semester.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

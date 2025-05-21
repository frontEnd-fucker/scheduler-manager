import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This is a simple middleware to simulate authentication
// In a real application, you would use a proper authentication solution like NextAuth.js
export function middleware(request: NextRequest) {
  // For demonstration purposes, we'll use a mock user ID
  // In a real app, you would verify the user's session here
  const mockUserId = 'user_123456789';
  
  // Check if the request is for an API route
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Clone the request headers and add the user ID
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', mockUserId);
    
    // Return the modified request
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }
  
  // For non-API routes, just continue
  return NextResponse.next();
}

// Configure the middleware to run on API routes
export const config = {
  matcher: ['/api/:path*'],
}; 
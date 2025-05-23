# Course Manager

A Next.js application for managing course schedules with drag-and-drop functionality.

## Features

- Create and manage course tables
- Add and remove courses
- Drag and drop courses onto a weekly schedule
- View course schedule in a weekly format
- Automatic time slot management
- Data persistence with PostgreSQL
- TanStack Query for efficient client-side data fetching

## Tech Stack

- **Frontend**: Next.js, React, Tailwind CSS, shadcn/ui, DnD Kit
- **Backend**: Next.js API Routes, Server Actions
- **Database**: PostgreSQL with Prisma ORM
- **State Management**: TanStack Query for server state
- **Authentication**: Simple middleware (mock implementation)

## Prerequisites

- Node.js (v18 or later)
- PostgreSQL database
- npm or yarn

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/course-manager.git
cd course-manager
```

### 2. Install dependencies

```bash
npm install
# or
yarn install
```

### 3. Set up environment variables

Create a `.env` file in the root directory with the following content:

```
DATABASE_URL="postgresql://username:password@localhost:5432/course_manager?schema=public"
```

Replace `username`, `password` with your PostgreSQL credentials.

### 4. Set up the database

```bash
# Generate Prisma client
npm run prisma:generate

# Push the schema to your database
npm run prisma:push

# Seed the database with initial data
npm run prisma:seed
```

### 5. Start the development server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Project Structure

- `app/` - Next.js App Router
- `components/` - React components
- `lib/` - Utility functions and Prisma client
- `prisma/` - Prisma schema and seed script
- `app/actions/` - Server actions for data mutations
- `app/api/` - API routes
- `app/hooks/` - React Query hooks for data fetching

## API Routes

- `GET /api/course-tables` - Get all course tables
- `POST /api/course-tables` - Create a new course table
- `GET /api/course-tables/:id` - Get a specific course table
- `PUT /api/course-tables/:id` - Update a course table
- `DELETE /api/course-tables/:id` - Delete a course table
- `GET /api/course-tables/:id/courses` - Get all courses for a table
- `POST /api/course-tables/:id/courses` - Add a course to a table
- `GET /api/course-tables/:id/courses/:courseId` - Get a specific course
- `PUT /api/course-tables/:id/courses/:courseId` - Update a course
- `DELETE /api/course-tables/:id/courses/:courseId` - Delete a course
- `GET /api/course-tables/:id/course-items` - Get all course items
- `POST /api/course-tables/:id/course-items` - Create a course item
- `GET /api/course-tables/:id/course-items/:itemId` - Get a specific course item
- `PUT /api/course-tables/:id/course-items/:itemId` - Update a course item
- `DELETE /api/course-tables/:id/course-items/:itemId` - Delete a course item
- `GET /api/course-tables/:id/time-slots` - Get all time slots
- `POST /api/course-tables/:id/time-slots` - Create a time slot
- `GET /api/course-tables/:id/time-slots/:slotId` - Get a specific time slot
- `PUT /api/course-tables/:id/time-slots/:slotId` - Update a time slot
- `DELETE /api/course-tables/:id/time-slots/:slotId` - Delete a time slot

## Server Actions

- `getCourseTablesForUser` - Get all course tables for a user
- `getCourseTable` - Get a specific course table
- `createCourseTable` - Create a new course table
- `updateCourseTable` - Update a course table
- `deleteCourseTable` - Delete a course table
- `getCoursesForTable` - Get all courses for a table
- `createCourse` - Create a new course
- `updateCourse` - Update a course
- `deleteCourse` - Delete a course
- `getCourseItemsForTable` - Get all course items for a table
- `createCourseItem` - Create a new course item
- `updateCourseItem` - Update a course item
- `deleteCourseItem` - Delete a course item
- `getTimeSlotsForTable` - Get all time slots for a table
- `createTimeSlot` - Create a new time slot
- `updateTimeSlot` - Update a time slot
- `deleteTimeSlot` - Delete a time slot

## React Query Hooks

- `useCourseTable` - Fetch and cache course table data
- `useCreateCourse` - Mutation for creating courses
- `useCreateCourseItem` - Mutation for creating course items
- `useDeleteCourseItem` - Mutation for deleting course items

## Authentication

This project uses a simple middleware to simulate authentication. In a production environment, you should replace it with a proper authentication solution like NextAuth.js or Auth0.

## Environment Variables Setup

For security reasons, sensitive environment variables are not stored in version control. The repository includes:

- `.env` with placeholder values (safe for version control)
- `.env.local` with actual development credentials (not committed to version control)

### Development Setup

1. Create a `.env.local` file with your actual credentials for local development
2. This file will override values in `.env`
3. Never commit `.env.local` to version control

### Production Setup

For production, use Vercel's environment variables configuration:

1. Go to your Vercel project dashboard
2. Navigate to Settings > Environment Variables
3. Add all required variables from your `.env.local` file
4. Vercel will automatically use these in production

#### 详细步骤

1. **登录 Vercel 账户**：访问 [Vercel 官网](https://vercel.com) 并登录您的账户

2. **选择您的项目**：在 Dashboard 中找到 course-manager 项目

3. **访问环境变量设置**：
   - 点击项目后进入项目详情页
   - 在左侧边栏找到 "Settings" 选项
   - 点击 "Environment Variables" 选项

4. **添加环境变量**：
   - 点击 "Add New" 按钮
   - 输入变量名称（例如 `DATABASE_URL`）
   - 输入变量值（您的实际数据库连接字符串）
   - 选择环境（Production、Preview、Development）
   - 点击 "Save" 按钮

5. **验证变量添加**：
   - 添加完所有变量后，您可以在列表中看到所有添加的变量
   - 确保所有必要的变量都已添加

6. **重新部署项目**：
   - 环境变量更改需要重新部署才能生效
   - 在项目概览页点击 "Redeploy" 按钮

7. **验证环境变量生效**：
   - 部署完成后，访问您的应用检查功能是否正常

#### 注意事项

- 环境变量在 Vercel 平台上是加密存储的
- 可以为不同的环境（Production、Preview、Development）设置不同的值
- 可以使用 Vercel CLI 添加环境变量：`vercel env add DATABASE_URL`
- 敏感信息（如数据库密码）可以使用 Vercel 的 [环境变量加密功能](https://vercel.com/docs/environment-variables/security)

This ensures sensitive data is never exposed in your codebase.

## License

MIT

# 课程列表页面功能说明

## 功能概述

根据提供的原型 `course-list-prototype.html`，我已经开发了一个完整的课程列表管理页面，包含以下功能：

## 主要功能

### 1. 课程表列表展示
- **卡片式布局**：每个课程表以卡片形式展示
- **课程表预览**：使用 `MiniCourseTable` 组件显示课程安排的缩略图
- **元数据显示**：显示创建时间、最后修改时间、课程数量等信息
- **响应式设计**：支持桌面端和移动端

### 2. 新建课程表功能
- **模态对话框**：使用 shadcn/ui 的 Dialog 组件
- **表单验证**：使用 react-hook-form + zod 进行表单验证
- **字段包括**：
  - 课程表名称（必填，最多50字符）
  - 课程表描述（可选，最多200字符）

### 3. 删除课程表功能
- **确认对话框**：防止误删除操作
- **警告提示**：明确告知删除的后果
- **课程统计**：显示将要删除的课程数量

### 4. 用户体验优化
- **悬停效果**：卡片悬停时显示删除按钮
- **过渡动画**：平滑的过渡效果
- **空状态**：当没有课程表时显示友好的空状态页面
- **面包屑导航**：清晰的页面层级导航

## 技术实现

### 组件结构
```
app/dashboard/schedules/page.tsx          # 主页面组件
components/ui/MiniCourseTable.tsx         # 迷你课程表预览组件
components/ui/CourseTable.tsx             # 原有的完整课程表组件（复用）
```

### 使用的技术栈
- **React Hook Form**：表单状态管理
- **Zod**：表单验证
- **shadcn/ui**：UI 组件库
  - Dialog（对话框）
  - Form（表单）
  - Card（卡片）
  - Button（按钮）
  - Input（输入框）
  - Textarea（文本域）
- **Lucide React**：图标库
- **Tailwind CSS**：样式

### 数据结构
```typescript
interface Schedule {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  courses: Course[];
}
```

## 页面路由

- **访问路径**：`/dashboard/schedules`
- **面包屑**：首页 > 课程表管理

## 假数据

目前使用假数据进行开发和测试：
- 2个示例课程表（2024春季学期、2024秋季学期）
- 包含不同的课程安排
- 8个时间段的时间表

## 特色功能

### 1. MiniCourseTable 组件
- 专门为卡片预览设计的迷你课程表
- 只显示前4个时间段，简化预览
- 使用深色背景突出课程显示
- 自动适配课程颜色主题

### 2. 表单验证
- 实时验证用户输入
- 友好的错误提示
- 防止提交无效数据

### 3. 删除确认流程
- 两步确认机制
- 详细的警告信息
- 显示影响范围（课程数量）

## 下一步开发建议

1. **编辑功能**：点击"编辑"按钮跳转到课程表编辑页面
2. **搜索和筛选**：添加课程表搜索和筛选功能
3. **排序功能**：按创建时间、修改时间、课程数量排序
4. **批量操作**：支持批量删除课程表
5. **导入导出**：支持课程表的导入和导出
6. **数据持久化**：连接真实的数据库API

## 如何测试

1. 启动开发服务器：`npm run dev`
2. 访问：`http://localhost:3000/dashboard/schedules`
3. 测试功能：
   - 查看课程表卡片
   - 点击"新建课程表"测试创建功能
   - 悬停卡片查看删除按钮
   - 测试删除确认流程

## 文件说明

- `app/dashboard/schedules/page.tsx`：主页面组件，包含所有业务逻辑
- `components/ui/MiniCourseTable.tsx`：迷你课程表组件，用于卡片预览
- 复用了现有的 `CourseTable.tsx` 组件的类型定义和工具函数 
import { useState, useCallback } from 'react';

// 类型定义
export type Schedule = {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  courses: Array<{
    id: string;
    name: string;
    dayOfWeek: number;
    timeSlotId: number;
    startTime: Date;
    endTime: Date;
  }>;
  _count: {
    courses: number;
  };
};

export type CreateScheduleData = {
  name: string;
  description?: string;
};

export type UpdateScheduleData = {
  name: string;
  description?: string;
};

// API 调用函数
const apiRequest = async (url: string, options?: RequestInit) => {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP错误: ${response.status}`);
  }

  return response.json();
};

export const useSchedules = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 获取所有课程表
  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await apiRequest('/api/schedules');
      
      // 转换日期字符串为Date对象
      const transformedData = data.map((schedule: any) => ({
        ...schedule,
        createdAt: new Date(schedule.createdAt),
        updatedAt: new Date(schedule.updatedAt),
        courses: schedule.courses.map((course: any) => ({
          ...course,
          startTime: new Date(course.startTime),
          endTime: new Date(course.endTime),
        })),
      }));
      
      setSchedules(transformedData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取课程表失败';
      setError(errorMessage);
      console.error('获取课程表失败:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 创建课程表
  const createSchedule = useCallback(async (data: CreateScheduleData): Promise<Schedule | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const newSchedule = await apiRequest('/api/schedules', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      
      // 转换日期字符串为Date对象
      const transformedSchedule = {
        ...newSchedule,
        createdAt: new Date(newSchedule.createdAt),
        updatedAt: new Date(newSchedule.updatedAt),
        courses: newSchedule.courses.map((course: any) => ({
          ...course,
          startTime: new Date(course.startTime),
          endTime: new Date(course.endTime),
        })),
      };
      
      setSchedules(prev => [transformedSchedule, ...prev]);
      return transformedSchedule;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '创建课程表失败';
      setError(errorMessage);
      console.error('创建课程表失败:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // 更新课程表
  const updateSchedule = useCallback(async (id: string, data: UpdateScheduleData): Promise<Schedule | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedSchedule = await apiRequest(`/api/schedules/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      
      // 转换日期字符串为Date对象
      const transformedSchedule = {
        ...updatedSchedule,
        createdAt: new Date(updatedSchedule.createdAt),
        updatedAt: new Date(updatedSchedule.updatedAt),
        courses: updatedSchedule.courses.map((course: any) => ({
          ...course,
          startTime: new Date(course.startTime),
          endTime: new Date(course.endTime),
        })),
      };
      
      setSchedules(prev => 
        prev.map(schedule => 
          schedule.id === id ? transformedSchedule : schedule
        )
      );
      return transformedSchedule;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '更新课程表失败';
      setError(errorMessage);
      console.error('更新课程表失败:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // 删除课程表
  const deleteSchedule = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      await apiRequest(`/api/schedules/${id}`, {
        method: 'DELETE',
      });
      
      setSchedules(prev => prev.filter(schedule => schedule.id !== id));
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '删除课程表失败';
      setError(errorMessage);
      console.error('删除课程表失败:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // 获取单个课程表
  const getSchedule = useCallback(async (id: string): Promise<Schedule | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const schedule = await apiRequest(`/api/schedules/${id}`);
      
      // 转换日期字符串为Date对象
      const transformedSchedule = {
        ...schedule,
        createdAt: new Date(schedule.createdAt),
        updatedAt: new Date(schedule.updatedAt),
        courses: schedule.courses.map((course: any) => ({
          ...course,
          startTime: new Date(course.startTime),
          endTime: new Date(course.endTime),
        })),
      };
      
      return transformedSchedule;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取课程表失败';
      setError(errorMessage);
      console.error('获取课程表失败:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    schedules,
    loading,
    error,
    fetchSchedules,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    getSchedule,
  };
}; 
"use server";

import { prisma } from "@/lib/prisma";
import { auth, currentUser } from '@clerk/nextjs/server';
import { revalidatePath } from "next/cache";

// 用户初始化检查和创建
export async function initializeUser() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return { error: "未登录" };
    }

    // 获取 Clerk 用户信息
    const clerkUser = await currentUser();
    
    if (!clerkUser) {
      return { error: "无法获取用户信息" };
    }

    // 检查用户是否已存在于数据库中
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (existingUser) {
      // 用户已存在，检查是否需要更新信息
      const needsUpdate = 
        existingUser.email !== clerkUser.emailAddresses[0]?.emailAddress ||
        existingUser.name !== (clerkUser.firstName && clerkUser.lastName 
          ? `${clerkUser.firstName} ${clerkUser.lastName}` 
          : clerkUser.firstName || clerkUser.lastName || null);

      if (needsUpdate) {
        const updatedUser = await prisma.user.update({
          where: { id: userId },
          data: {
            email: clerkUser.emailAddresses[0]?.emailAddress || existingUser.email,
            name: clerkUser.firstName && clerkUser.lastName 
              ? `${clerkUser.firstName} ${clerkUser.lastName}` 
              : clerkUser.firstName || clerkUser.lastName || existingUser.name,
          },
        });
        
        console.log(`Updated user: ${updatedUser.name} (${updatedUser.email})`);
        return { data: updatedUser, created: false, updated: true };
      }

      return { data: existingUser, created: false, updated: false };
    }

    // 用户不存在，创建新用户
    const newUser = await prisma.user.create({
      data: {
        id: userId,
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        name: clerkUser.firstName && clerkUser.lastName 
          ? `${clerkUser.firstName} ${clerkUser.lastName}` 
          : clerkUser.firstName || clerkUser.lastName || null,
      },
    });

    console.log(`Created new user: ${newUser.name} (${newUser.email})`);
    
    // 重新验证相关路径
    revalidatePath('/dashboard');
    
    return { data: newUser, created: true, updated: false };
  } catch (error) {
    console.error("Failed to initialize user:", error);
    return { error: "用户初始化失败" };
  }
}

// 获取当前用户信息
export async function getCurrentUser() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return { error: "未登录" };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        courseTables: {
          orderBy: { updatedAt: 'desc' },
          take: 5, // 只获取最近的5个课程表
        },
        _count: {
          select: { courseTables: true },
        },
      },
    });

    if (!user) {
      return { error: "用户不存在" };
    }

    return { data: user };
  } catch (error) {
    console.error("Failed to get current user:", error);
    return { error: "获取用户信息失败" };
  }
} 
import { NextResponse } from "next/server";
import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "未登录" },
        { status: 401 }
      );
    }

    // 获取 Clerk 用户信息
    const clerkUser = await currentUser();
    
    if (!clerkUser) {
      return NextResponse.json(
        { error: "无法获取用户信息" },
        { status: 400 }
      );
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
        
        return NextResponse.json({ 
          data: updatedUser, 
          created: false, 
          updated: true 
        });
      }

      return NextResponse.json({ 
        data: existingUser, 
        created: false, 
        updated: false 
      });
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
    
    return NextResponse.json({ 
      data: newUser, 
      created: true, 
      updated: false 
    });
  } catch (error) {
    console.error("Failed to initialize user:", error);
    return NextResponse.json(
      { error: "用户初始化失败" },
      { status: 500 }
    );
  }
}

// GET 请求用于获取当前用户信息
export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "未登录" },
        { status: 401 }
      );
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
      return NextResponse.json(
        { error: "用户不存在" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: user });
  } catch (error) {
    console.error("Failed to get current user:", error);
    return NextResponse.json(
      { error: "获取用户信息失败" },
      { status: 500 }
    );
  }
} 
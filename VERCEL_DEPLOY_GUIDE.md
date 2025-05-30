# Vercel部署指南 - Prisma构建修复

## 问题描述
在Vercel上部署时遇到Prisma客户端初始化错误：
```
Error [PrismaClientInitializationError]: Prisma has detected that this project was built on Vercel, which caches dependencies. This leads to an outdated Prisma Client because Prisma's auto-generation isn't triggered.
```

## 修复方案

我们实施了多层防护来确保在Vercel构建过程中Prisma客户端能正确生成：

### 1. 修改构建脚本
在 `package.json` 中修改了build脚本：
```json
{
  "scripts": {
    "build": "prisma generate && next build"
  }
}
```

### 2. 添加postinstall脚本
添加了postinstall钩子作为额外保障：
```json
{
  "scripts": {
    "postinstall": "prisma generate"
  }
}
```

### 3. Vercel配置文件
创建了 `vercel.json` 配置：
```json
{
  "buildCommand": "prisma generate && npm run build",
  "functions": {
    "app/api/**": {
      "maxDuration": 30
    }
  },
  "env": {
    "PRISMA_CLI_BINARY_TARGETS": "native,rhel-openssl-1.0.x"
  }
}
```

### 4. Prisma Schema优化
在 `prisma/schema.prisma` 中添加了：
```prisma
generator client {
  provider = "prisma-client-js"
  binaryTargets = ["native", "rhel-openssl-1.0.x"]
  output = "../node_modules/@prisma/client"
}
```

## 部署步骤

1. **确保环境变量设置正确**
   - 在Vercel项目设置中配置 `DATABASE_URL`
   - 配置Clerk认证相关的环境变量

2. **构建测试**
   ```bash
   npm run build
   ```

3. **部署到Vercel**
   ```bash
   vercel --prod
   ```

## 常见问题解决

### 数据库连接问题
- 确保 `DATABASE_URL` 包含正确的SSL模式
- 对于Vercel Postgres，使用连接池URL

### Prisma Client版本问题
- 定期更新Prisma版本：
  ```bash
  npm i --save-dev prisma@latest
  npm i @prisma/client@latest
  ```

### Binary Targets
- 如果遇到运行时错误，可能需要调整 `binaryTargets`
- Vercel使用 `rhel-openssl-1.0.x` 目标

## 验证修复
构建成功后，您应该看到：
```
✔ Generated Prisma Client (v6.7.0) to ./node_modules/@prisma/client
✓ Compiled successfully
```

## 注意事项
- 每次修改Prisma schema后都要运行 `prisma generate`
- 在本地开发时使用 `npm run dev` 
- 生产环境构建会自动处理Prisma客户端生成 
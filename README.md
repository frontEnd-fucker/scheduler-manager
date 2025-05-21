This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Neon Postgres (Vercel Native) 数据库设置

本项目使用 [Neon Postgres](https://neon.tech/) 作为数据库，并通过 Vercel Storage 原生集成。

1. 登录 [Vercel 控制台](https://vercel.com/dashboard)，进入你的项目。
2. 点击左侧菜单 Storage → Postgres，选择 Neon，创建数据库。
3. 创建完成后，Vercel 会自动为你的项目注入 `POSTGRES_PRISMA_URL` 环境变量。
4. 在本地开发时，进入 Vercel 控制台数据库详情页，点击 Connect，复制 Prisma 连接字符串，粘贴到 `.env` 文件的 `DATABASE_URL`。
   ```env
   DATABASE_URL="postgresql://user:password@ep-xxxxxx.us-east-2.aws.neon.tech/dbname?sslmode=require"
   ```
5. 运行以下命令同步数据库结构：
   ```bash
   npm run prisma:generate
   npm run prisma:push
   # 或使用迁移
   npm run prisma:migrate --name init
   ```

## 开发

数据库配置好后，启动开发服务器：

```bash
npm run dev
```

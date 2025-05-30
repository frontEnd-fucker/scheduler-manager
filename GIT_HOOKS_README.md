# Git Hooks 配置说明 (Husky + Lint-staged)

## 概述

本项目使用 **Husky** 来管理 Git hooks，结合 **lint-staged** 来优化性能。这确保了：
- 团队成员都有相同的 Git hooks 配置
- 只检查修改过的文件，提高效率
- 配置文件可以版本控制，易于维护

## 配置架构

### Pre-commit Hook
- **触发时机**: `git commit` 前
- **检查范围**: 暂存区 (staged) 的 `.ts` 和 `.tsx` 文件
- **功能**: 使用 `lint-staged` 自动修复可修复的 ESLint 问题

### Pre-push Hook  
- **触发时机**: `git push` 前
- **检查范围**: 即将推送的 TypeScript 文件
- **功能**: 运行 ESLint 检查，确保代码质量

## 工作流程

### 提交代码
```bash
git add .
git commit -m "your message"
```
执行流程：
1. 🔍 `pre-commit` hook 触发
2. 📝 `lint-staged` 检查暂存的 .ts/.tsx 文件
3. 🔧 自动修复可修复的问题
4. ✅ 通过检查后完成提交

### 推送代码
```bash
git push origin main
```
执行流程：
1. 🔍 `pre-push` hook 触发
2. 📝 分析即将推送的提交
3. 🔎 检查修改的 TypeScript 文件
4. ✅ 通过检查后完成推送

## 可用命令

```bash
# 基本的 lint 检查
npm run lint

# 自动修复可修复的 lint 问题
npm run lint:fix

# 手动运行 lint-staged
npm run lint:staged

# Husky 管理命令
npm run hooks:install    # 安装/重新安装 husky
npm run hooks:add        # 添加新的 hook

# 跳过检查（不推荐）
git commit --no-verify   # 跳过 pre-commit
git push --no-verify     # 跳过 pre-push
```

## 文件结构

```
.husky/
├── _/                   # Husky 内部文件
├── pre-commit          # 提交前检查 (lint-staged)
└── pre-push            # 推送前检查 (eslint)

package.json
├── scripts             # npm 脚本
├── devDependencies     # husky + lint-staged
└── lint-staged         # lint-staged 配置
```

## 配置详情

### Lint-staged 配置 (`package.json`)
```json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "git add"
    ]
  }
}
```

### Husky Scripts (`package.json`)
```json
{
  "scripts": {
    "prepare": "husky",
    "lint:staged": "lint-staged",
    "hooks:install": "husky",
    "hooks:add": "husky add"
  }
}
```

## 团队协作

### 新成员设置
每个团队成员在克隆项目后：
```bash
git clone <repository>
cd <project>
npm install          # 自动安装依赖并设置 husky
```

### 常见问题

**Q: Hook 检查失败怎么办？**
A: 
1. 运行 `npm run lint:fix` 自动修复
2. 手动修复剩余问题
3. 重新提交/推送

**Q: 如何添加新的 hook？**
A: 
```bash
npx husky add .husky/commit-msg 'npx commitlint --edit $1'
```

**Q: 如何临时禁用 hooks？**
A: 
```bash
git commit --no-verify
git push --no-verify
```

**Q: Hook 权限问题？**
A:
```bash
chmod +x .husky/pre-commit
chmod +x .husky/pre-push
```

## 验证状态

✅ **Husky 已安装**: 依赖已添加到 devDependencies  
✅ **Pre-commit 已配置**: 使用 lint-staged 检查暂存文件  
✅ **Pre-push 已配置**: 检查即将推送的修改  
✅ **权限已设置**: Hooks 具有执行权限  
✅ **团队友好**: 配置可版本控制，自动同步

## 当前检测到的问题

项目中仍有一些需要修复的 ESLint 错误：
- 未使用的变量 (`@typescript-eslint/no-unused-vars`)
- 不当的 `any` 类型使用 (`@typescript-eslint/no-explicit-any`)  
- 未转义的引号 (`react/no-unescaped-entities`)

## 性能优化

### Lint-staged 优势
- ⚡ **快速**: 只检查暂存的文件
- 🎯 **精准**: 只处理即将提交的更改
- 🔧 **自动修复**: 自动修复可修复的问题

### Pre-push 智能检查
- 📊 **智能**: 根据推送内容选择检查策略
- 🚀 **高效**: 优先检查修改的文件
- 💡 **友好**: 提供清晰的错误信息和修复建议

## 迁移说明

如果之前使用了手动创建的 Git hooks，Husky 会自动接管。旧的 `.git/hooks/` 文件已被删除，现在由 `.husky/` 目录统一管理。

---

🎉 **配置完成！** 现在你的项目已经有了完整的 Git hooks 保护，确保代码质量和团队协作的一致性。 
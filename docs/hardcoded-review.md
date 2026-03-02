# 硬编码代码审核清单

> 创建时间：2026-03-01
> 状态：待处理

---

## 1. 默认模型名称

| 文件 | 行号 | 硬编码内容 | 说明 | 优先级 |
|------|------|-----------|------|--------|
| `src/pages/CreateScript.tsx` | 45 | `'Doubao-Seed-2.0-lite'` | 默认模型名称 | 中 |
| `src/pages/CreateScript.tsx` | 176 | `'Doubao-Seed-2.0-lite'` | 后备模型名称 | 中 |
| `src/pages/admin/ModelManagement.tsx` | 282 | `"e.g. doubao-pro-32k;doubao-lite-4k"` | 占位符示例 | 低 |

**建议处理方式**：
- 可以保留作为后备值
- 或从环境变量/配置中读取
- 或从数据库配置中获取默认模型

---

## 2. 占位图片/视频 URL（Mock 数据）

| 文件 | 行号 | 硬编码内容 | 说明 | 优先级 | 状态 |
|------|------|-----------|------|--------|------|
| `api/services/aiService.ts` | 185-195 | Unsplash 图片 URL 列表 | 图像生成 Mock 数据 | 高 | ✅ 已优化 |
| `api/services/aiService.ts` | 213 | Google Storage 视频 URL | 视频生成 Mock 数据 | 高 | ✅ 已优化 |

**处理方式**：
- 使用 Unsplash 真实图片作为 Mock 数据，提升用户体验
- 使用 Google Storage 示例视频作为 Mock 数据
- 接入真实 AI 图像/视频生成 API 后替换

---

## 3. 已修复的硬编码

| 文件 | 原内容 | 修复方式 |
|------|--------|----------|
| `src/pages/Login.tsx` | `http://localhost:3000/api/auth/login` | 改为 `/api/auth/login` |
| `src/pages/Dashboard.tsx` | `http://localhost:3000/api/projects` | 改为 `/api/projects` |
| `src/pages/CreateScript.tsx` | `http://localhost:3000/api/ai/models` | 改为 `/api/ai/models` |
| `src/pages/CreateStoryboard.tsx` | `http://localhost:3000/api/ai/generate-image` | 改为 `/api/ai/generate-image` |
| `src/pages/CreateVideo.tsx` | `http://localhost:3000/api/ai/generate-video` | 改为 `/api/ai/generate-video` |
| `src/pages/Register.tsx` | `http://localhost:3000/api/auth/register` | 改为 `/api/auth/register` |
| `src/pages/Works.tsx` | `http://localhost:3000/api/projects` | 改为 `/api/projects` |
| `src/pages/admin/Analytics.tsx` | `http://localhost:3000/api/admin/system/stats` | 改为 `/api/admin/system/stats` |
| `src/pages/admin/Monitoring.tsx` | `http://localhost:3000/api/admin/system/stats` | 改为 `/api/admin/system/stats` |
| `src/pages/admin/AdminLogin.tsx` | `http://localhost:3000/api/auth/login` | 改为 `/api/auth/login` |

---

## 4. 已替换的原生 alert

| 文件 | 修复方式 |
|------|----------|
| `src/pages/CreateScript.tsx` | 使用自定义错误弹窗组件 |
| `src/pages/CreateStoryboard.tsx` | 使用自定义错误弹窗组件 |

---

## 处理进度

- [x] API URL 硬编码修复
- [x] 原生 alert 替换为自定义弹窗
- [ ] 默认模型名称配置化
- [ ] Mock 图片/视频替换为真实 API

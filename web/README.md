# 衣搭 Web MVP

这是 `docs/MVP-PRD.md` 与 `docs/TECHNICAL-DESIGN.md` 对应的正式 Web/PWA 实现，旧版流程原型仍保留在 `../demo/`。

## 本地运行

需要 Node.js 20.9+ 和 pnpm。

```bash
pnpm install --frozen-lockfile
pnpm dev
```

打开 `http://localhost:3000`。生产检查：

```bash
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

仓库中的演示素材已清除 EXIF、XMP、IPTC 与 ICC 数据；`pnpm check:demo-metadata` 会在 CI 中防止敏感元数据再次进入公开仓库。

## AI 模式

默认 `YIDA_AI_MODE=mock`。当前模式完整实现上传确认、本地衣柜、匹配、异步任务状态、整套组合示意、收藏与 PWA 外壳，但识别、推荐和图像任务使用明确标注的模拟适配器。

真实服务需要先完成技术方案 M0：确认供应商、可用地区、模型、预算、密钥、任务持久化和图片保留策略。设置 `YIDA_AI_MODE=real` 但未完成适配时，API 会明确返回“真实服务尚未配置”，不会伪装为模拟成功。

生产部署必须配置高强度随机值 `YIDA_SESSION_SECRET`，并使用 HTTPS。

本地照片存储在 IndexedDB；Service Worker 不缓存 `/api` 私人响应。不要把供应商密钥写入 `NEXT_PUBLIC_*` 或提交到仓库。

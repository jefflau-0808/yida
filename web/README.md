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

真实衣物识别与文字搭配已经提供 OpenAI 服务端适配器，使用 Responses API 的图片输入和严格结构化输出，且请求设置 `store: false`。复制 `.env.example` 为 `.env.local`，填写服务端 `OPENAI_API_KEY` 并将 `YIDA_AI_MODE` 改为 `real` 即可启用。默认模型是 `gpt-5.6-luna`，可通过 `YIDA_OPENAI_TEXT_MODEL` 覆盖。密钥缺失、无权限、额度不足、限流和超时都会显示明确错误，不会静默降级为模拟结果。

真实 AI 生图仍保持关闭。真实文字模式下界面会明确把现有图片标为“本地占位参考”；接入生图前需要确认单次预算、任务持久化、部署超时和图片保留策略。默认 `mock` 模式不会调用外部服务，也不会产生 API 费用。

生产部署必须配置高强度随机值 `YIDA_SESSION_SECRET`，并使用 HTTPS。

本地照片存储在 IndexedDB；Service Worker 不缓存 `/api` 私人响应。不要把供应商密钥写入 `NEXT_PUBLIC_*` 或提交到仓库。

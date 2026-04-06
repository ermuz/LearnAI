# @ermuz/node-shared

`apps-node/*` 的仓库级共享工具包。

## 导出能力

- `@ermuz/node-shared/env`
  - `loadAppEnv(moduleUrl, options?)`
- `@ermuz/node-shared/openai`
  - `createChatModel(options?)`
  - `createEmbeddings(options?)`

## 环境变量加载器（env）

建议在每个应用入口文件（如 `src/index.ts`）里，先加载环境变量，再执行其他模块：

```ts
import { loadAppEnv } from "@ermuz/node-shared/env";

loadAppEnv(import.meta.url, { includeLocal: true });
```

### `loadAppEnv` 参数

- `includeLocal`（默认 `true`）：是否同时加载 `.env.local`
- `rootRelativeToModule`（默认 `".."`）：应用根目录相对于当前模块的路径
- `override`（默认 `true`）：是否覆盖已有 `process.env`
- `debug`（默认 `true`）：是否开启 dotenv 调试日志

## OpenAI 工厂（openai）

```ts
import { createChatModel, createEmbeddings } from "@ermuz/node-shared/openai";

const model = createChatModel({ temperature: 0.2 });
const embeddings = createEmbeddings({ dimensions: 1024 });
```

### `createChatModel` 参数

- `model`
- `apiKey`
- `baseURL`
- `temperature`（默认 `0`）

默认读取以下环境变量：

- `OPENAI_MODEL`
- `OPENAI_API_KEY`
- `OPENAI_BASE_URL`（若不存在则回退到 `OPEN_BASE_URL`）

### `createEmbeddings` 参数

- `model`
- `apiKey`
- `baseURL`
- `dimensions`

默认读取以下环境变量：

- `OPENAI_EMBEDDINGS_MODEL`
- `OPENAI_API_KEY`
- `OPENAI_BASE_URL`（若不存在则回退到 `OPEN_BASE_URL`）

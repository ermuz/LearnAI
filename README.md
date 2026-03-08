# @ermuz/LearnAI

**AI 学习用** 仓库，内含 **TypeScript** 与 **Python** 项目，统一用 **pnpm** + **Turborepo** 管理。  
运行环境版本由 [Proto](https://moonrepo.dev/proto) 统一管理（Node、Python 等），见根目录 `.prototools`。

## 结构

- `packages/` - 共享包（如 `shared`）
- `apps-node/` - Node/TS 应用（可选）

## 开发

**运行环境（可选）**：若已安装 [Proto](https://moonrepo.dev/proto)，在仓库根目录执行 `proto install` 会按 `.prototools` 安装 Node 20 与 Python 3.12；之后可用 `proto run node -- ...` / `proto run python -- ...` 指定运行时。

```bash
# 安装依赖
pnpm install

# 所有包并行 dev
pnpm dev

# 构建所有包（按依赖顺序）
pnpm build

# 代码检查（ESLint，根目录统一执行）
pnpm lint
```

根目录使用 ESLint 9 + TypeScript ESLint（flat config：`eslint.config.mjs`），并与 Prettier 兼容（`eslint-config-prettier`）。pre-commit 时会对暂存文件执行 `eslint --fix` 和 Prettier。

## Git 校验（Husky）

克隆或首次 `pnpm install` 后会自动执行 `prepare`，将 Git hooks 指向 `.husky/`：

- **pre-commit**：对暂存文件执行 `lint-staged`（当前为 Prettier 格式化）
- **commit-msg**：用 Commitlint 校验提交信息，需符合 [Conventional Commits](https://www.conventionalcommits.org/)

合法提交示例：`feat: 新功能`、`fix: 修复登录`、`chore: 更新依赖`。  
类型：`feat`、`fix`、`docs`、`style`、`refactor`、`perf`、`test`、`build`、`ci`、`chore`、`revert`。

## 添加新包

- **共享包**：在 `packages/` 下新建目录并添加 `package.json`，name 自定（如 `shared`、`ui`）。
- **应用**：在 `apps-node/` 下新建目录并添加 `package.json`。

新包会被 `pnpm-workspace.yaml` 的 `packages/*` 和 `apps-node/*` 自动识别。

import { config } from "dotenv";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { ChatOpenAI } from "@langchain/openai";
import {
  BaseMessage,
  HumanMessage,
  SystemMessage,
  ToolMessage,
} from "@langchain/core/messages";
import {
  executeCommandTool,
  listDirectoryTool,
  readFileTool,
  writeFileTool,
} from "./tools.js";
import { spinner } from "@clack/prompts";
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

config({ path: join(root, ".env") });
config({ path: join(root, ".env.local"), override: true });

const model = new ChatOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  model: "qwen-plus",
  temperature: 0,
  configuration: {
    baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  },
});

const tools = [
  readFileTool,
  listDirectoryTool,
  writeFileTool,
  executeCommandTool,
];

const modelWithTools = model.bindTools(tools);

const runAgentWithTools = async (query: string, maxIterations: number) => {
  const messages: BaseMessage[] = [
    new SystemMessage(`你是一个项目管理助手，使用工具完成任务。

			当前工作目录: ${process.cwd()}

			工具：
			1. readFile: 读取文件
			2. writeFile: 写入文件
			3. executeCommand: 执行命令（支持 workingDirectory 参数）
			4. listDirectory: 列出目录

			重要规则 - executeCommand：
			- workingDirectory 参数会自动切换到指定目录
			- 当使用 workingDirectory 时，绝对不要在 command 中使用 cd
			- 错误示例: { command: "cd react-todo-app && pnpm install", workingDirectory: "react-todo-app" }
			这是错误的！因为 workingDirectory 已经在 react-todo-app 目录了，再 cd react-todo-app 会找不到目录
			- 正确示例: { command: "pnpm install", workingDirectory: "react-todo-app" }
			这样就对了！workingDirectory 已经切换到 react-todo-app，直接执行命令即可

			重要规则 - writeFile：
			- 当写入 React 组件文件（如 App.tsx）时，如果存在对应的 CSS 文件（如 App.css），在其他 import 语句后加上这个 css 的导入
`),
    new HumanMessage(query),
  ];
  for (let i = 0; i < maxIterations; i++) {
    const s = spinner();
    s.start("AI正在思考...");
    const response = await modelWithTools.invoke(messages);
    s.stop("AI思考完毕");
    messages.push(response);
    if (!response.tool_calls?.length) {
      console.log(`[AI最终回答]：${response.content}`);
      return response.content;
    }
    for (const toolCall of response.tool_calls) {
      const findTool = tools.find((tool) => tool.name === toolCall.name);
      if (!findTool) {
        console.error(`未找到工具：${toolCall.name}`);
        continue;
      }
      // @ts-expect-error 111
      const toolResult = await findTool.invoke(
        findTool.schema.parse(toolCall.args),
      );
      messages.push(
        new ToolMessage({
          content: toolResult,
          tool_call_id: toolCall.id!,
        }),
      );
    }
  }
  return messages[messages.length - 1].content;
};

// echo 在 windows 可能不支持，可以去掉 echo 试试，不一定需要用户选择，或者换成 windows 的命令写法
const case1 = `创建一个功能丰富的 React TodoList 应用：

1. 创建项目：echo -e "n\nn" | pnpm create vite react-todo-app --template react-ts
2. 修改 src/App.tsx，实现完整功能的 TodoList：
 - 添加、删除、编辑、标记完成
 - 分类筛选（全部/进行中/已完成）
 - 统计信息显示
 - localStorage 数据持久化
3. 添加复杂样式：
 - 渐变背景（蓝到紫）
 - 卡片阴影、圆角
 - 悬停效果
4. 添加动画：
 - 添加/删除时的过渡动画
 - 使用 CSS transitions
5. 列出目录确认

注意：使用 pnpm，功能要完整，样式要美观，要有动画效果

之后在 react-todo-app 项目中：
1. 使用 pnpm install 安装依赖
2. 使用 pnpm run dev 启动服务器
`;

try {
  runAgentWithTools(case1, 30);
} catch (error) {
  console.error(`\n❌ 错误: ${(error as Error).message}\n`);
}

import { config } from "dotenv";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { MultiServerMCPClient } from "@langchain/mcp-adapters";

import { ChatOpenAI } from "@langchain/openai";
import {
  BaseMessage,
  HumanMessage,
  ToolMessage,
} from "@langchain/core/messages";
import { writeFileTool } from "./tools.js";
import { spinner } from "@clack/prompts";
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

config({ path: join(root, ".env") });
config({ path: join(root, ".env.local"), override: true });

const model = new ChatOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  model: "qwen3.5-plus",
  temperature: 0,
  configuration: {
    baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  },
});

const mcpClient = new MultiServerMCPClient({
  mcpServers: {
    "my-mcp-server": {
      command: "tsx",
      args: [
        "/Users/ermuz/Documents/code/AI/LearnAI/apps-node/tool-test/src/my-mcp-server.ts",
      ],
    },
    "baidu-maps-StreamableHTTP": {
      url: "https://mcp.map.baidu.com/mcp?ak=jwtX0nuPb7ttnIPE48ZxjKPa99oY4Lvs",
    },
    "chrome-devtools": {
      command: "npx",
      args: ["-y", "chrome-devtools-mcp@latest"],
    },
  },
});

const mcpTools = await mcpClient.getTools();

const tools = [...mcpTools, writeFileTool];

const modelWithTools = model.bindTools(tools);

const runAgentWithTools = async (query: string, maxIterations: number = 30) => {
  const messages: BaseMessage[] = [new HumanMessage(query)];
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
      console.log(
        `[工具调用] ${toolCall.name}(${JSON.stringify(toolCall.args)})`,
      );
      // @ts-expect-error 111
      const toolResult = await findTool.invoke(toolCall.args);
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
const case1 = `北京南站附近的酒店，以及去的路线，还有酒店图片，使用 writeFile 生成md文件,保存在当前目录下，并将文件路径返回给我，使用浏览器打开酒店的图片`;
// const case1 = `帮我打开浏览器，然后搜索一下“北京南站附近的酒店”，并将搜索结果的标题和链接保存到一个md文件里，最后把这个md文件的路径返回给我。`;

try {
  await runAgentWithTools(case1, 30);
  await mcpClient.close();
} catch (error) {
  console.error(`\n❌ 错误: ${(error as Error).message}\n`);
}

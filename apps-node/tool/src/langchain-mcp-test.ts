import { MultiServerMCPClient } from "@langchain/mcp-adapters";

import {
  BaseMessage,
  HumanMessage,
  ToolMessage,
} from "@langchain/core/messages";

import { spinner } from "@clack/prompts";
import { createChatModel, loadAppEnv } from "@ermuz/node-shared";

loadAppEnv(import.meta.url, { includeLocal: true });

const model = createChatModel({
  model: "qwen-plus",
  baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
});

const mcpClient = new MultiServerMCPClient({
  mcpServers: {
    "my-mcp-server": {
      command: "tsx",
      args: [
        "/Users/ermuz/Documents/code/AI/LearnAI/apps-node/tool-test/src/my-mcp-server.ts",
      ],
    },
  },
});

const tools = await mcpClient.getTools();

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
const case1 = `请查询用户 ID 为 "002" 的用户信息，并返回给我。`;

try {
  await runAgentWithTools(case1, 30);
  await mcpClient.close();
} catch (error) {
  console.error(`\n❌ 错误: ${(error as Error).message}\n`);
}

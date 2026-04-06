import { readFile } from "node:fs/promises";

import { tool } from "@langchain/core/tools";
import z from "zod";
import {
  BaseMessage,
  HumanMessage,
  SystemMessage,
  ToolMessage,
} from "@langchain/core/messages";
import { createChatModel, loadAppEnv } from "@ermuz/node-shared";

loadAppEnv(import.meta.url, { includeLocal: true });

const model = createChatModel({
  model: "qwen-coder-turbo",
  baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
});

const fileReadTool = tool(
  async ({ filePath }: { filePath: string }) => {
    console.log(`[工具调用] readFile: ${filePath}`);
    const content = await readFile(filePath, "utf8");
    console.log(
      `[工具调用] readFile: ${filePath}，成功读取 ${content.length} 字符`,
    );
    return content;
  },
  {
    name: "readFile",
    description:
      "用此工具来读取文件内容。当用户要求读取文件、查看代码、分析文件内容时，调用此工具。输入文件路径（可以是相对路径或绝对路径）。",
    schema: z.object({
      filePath: z.string().describe("要读取的文件路径"),
    }),
  },
);

const tools = [fileReadTool];

const modelWithTools = model.bindTools(tools);

const messages: BaseMessage[] = [
  new SystemMessage(`你是一个代码助手，可以使用工具读取文件内容并解析代码。

		工作流程：
		1. 用户要求读取文件内容是，立即调用 readFile 工具读取文件内容
		2. 等待工具返回文件内容
		3. 根据文件内容，分析代码，并给出分析结果

		可用工具：
		- readFile: 读取文件内容
		`),
  new HumanMessage(`读取文件内容：src/tool-file-read.ts 并解释代码功能`),
];

let response = await modelWithTools.invoke(messages);

messages.push(response);

while (response.tool_calls?.length) {
  const toolCalls = response.tool_calls.filter((tool) => !!tool.name);

  const results = await Promise.all(
    toolCalls.map(async (tc) => {
      console.log(`[工具调用] toolCall: ${tc.name}`);
      const tool = tools.find((item) => item.name === tc.name);
      if (!tool) {
        throw new Error(`没有找到工具: ${tc.name}`);
      }
      return tool.invoke(tool.schema.parse(tc.args));
    }),
  );
  toolCalls.forEach((tc, index) => {
    messages.push(
      new ToolMessage({
        content: results[index],
        tool_call_id: tc.id!,
      }),
    );
  });
  response = await modelWithTools.invoke(messages);
  messages.push(response);
}

console.log("最终答案：", response.content);

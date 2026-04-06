import { InMemoryChatMessageHistory } from "@langchain/core/chat_history";
import { HumanMessage, ToolMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { createChatModel } from "@ermuz/node-shared/openai";

const history = new InMemoryChatMessageHistory();

// 初始化模型
const model = createChatModel();

// 定义结构化输出的 schema
const scientistSchema = z.object({
  name: z.string().describe("科学家的全名"),
  birth_year: z.number().describe("出生年份"),
  nationality: z.string().describe("国籍"),
  fields: z.array(z.string()).describe("研究领域列表"),
});

const question = `介绍一下爱因斯坦`;

const extraScientistInfoTool = tool(
  async (data) => {
    console.log("extraScientistInfoTool", data);
    return data;
  },
  {
    name: "extract_scientist_info",
    description: "提取和结构化科学家的详细信息",
    schema: scientistSchema,
  },
);

const tools = [extraScientistInfoTool];
const modelWithTool = model.bindTools(tools);

try {
  const userMessage = new HumanMessage(question);
  await history.addMessage(userMessage);
  console.log("🤔 正在调用大模型（使用 Zod Schema）...\n");

  let response = await modelWithTool.invoke([userMessage]);
  await history.addMessage(response);

  console.log("📤 模型原始响应:\n");
  while (response.tool_calls?.length) {
    const toolCalls = response.tool_calls;
    const results = await Promise.all(
      toolCalls.map((toolCall) => {
        const tc = tools.find((item) => toolCall.name === item.name);
        if (!tc) {
          throw new Error(`没有找到工具: ${toolCall.name}`);
        }
        return tc.invoke(tc.schema.parse(toolCall.args));
      }),
    );
    await history.addMessages(
      toolCalls.map((tc, index) => {
        return new ToolMessage({
          tool_call_id: tc.id!,
          content: JSON.stringify(results[index]),
        });
      }),
    );
    response = await modelWithTool.invoke(await history.getMessages());
    console.log("response", response.content);
  }
} catch (error) {
  console.error("❌ 错误:", (error as Error).message);
}

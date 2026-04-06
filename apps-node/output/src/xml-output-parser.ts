import { XMLOutputParser } from "@langchain/core/output_parsers";
import { createChatModel } from "@ermuz/node-shared/openai";

// 初始化模型
const model = createChatModel();

const parser = new XMLOutputParser();

const question = `请提取以下文本中的人物信息：阿尔伯特·爱因斯坦出生于 1879 年，是一位伟大的物理学家。

${parser.getFormatInstructions()}`;

console.log("question:", question);

try {
  console.log("🤔 正在调用大模型（使用 XMLOutputParser）...\n");

  const response = await model.invoke(question);

  console.log("📤 模型原始响应:\n");
  console.log(response.content);

  const result = await parser.parse(response.content as string);

  console.log("\n✅ XMLOutputParser 自动解析的结果:\n");
  console.log(result);
} catch (error) {
  console.error("❌ 错误:", (error as Error).message);
}

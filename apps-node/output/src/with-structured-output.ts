import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";

// 初始化模型
const model = new ChatOpenAI({
  // withStructuredOutput 需要使用特定模型
  model: "qwen3-vl-plus",
  apiKey: process.env.OPENAI_API_KEY,
  temperature: 0,
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL,
  },
});

const scientistSchema = z.object({
  name: z.string().describe("科学家的全名"),
  birth_year: z.number().describe("出生年份"),
  nationality: z.string().describe("国籍"),
  fields: z.array(z.string()).describe("研究领域列表"),
});

const withStructuredOutputModel = model.withStructuredOutput(scientistSchema, {
  method: "jsonSchema",
});

const question = `请介绍一下居里夫人（Marie Curie）的详细信息，包括她的教育背景、研究领域、获得的奖项、主要成就和著名理论`;

console.log("📋 生成的提示词:\n");
console.log(question);

try {
  console.log("🤔 正在调用大模型（使用 Zod Schema）...\n");

  const result = await withStructuredOutputModel.invoke(question);

  console.log("📤 模型原始响应:\n");

  console.log("✅ StructuredOutputParser 自动解析并验证的结果:\n");
  console.log(JSON.stringify(result, null, 2));

  console.log("📊 格式化展示:\n");
  console.log(`👤 姓名: ${result.name}`);
  console.log(`📅 出生年份: ${result.birth_year}`);
} catch (error) {
  console.error("❌ 错误:", (error as Error).message);
}

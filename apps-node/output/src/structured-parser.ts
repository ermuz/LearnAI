import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { createChatModel } from "@ermuz/node-shared/openai";

// 初始化模型
const model = createChatModel();

const parser = StructuredOutputParser.fromNamesAndDescriptions({
  name: "姓名",
  birth_year: "出生年份",
  nationality: "国籍",
  major_achievements: "主要成就，用逗号分隔的字符串",
  famous_theory: "著名理论",
});

const question = `请介绍一下爱因斯坦的信息。请以 JSON 格式返回，包含以下字段：name（姓名）、birth_year（出生年份）、nationality（国籍）、major_achievements（主要成就，数组）、famous_theory（著名理论）,
  ${parser.getFormatInstructions()}
  `;

try {
  console.log("🤔 正在调用大模型...\n", question);
  const response = await model.invoke(question);
  console.log("✅ 收到响应:\n");
  console.log(response.content);
  const result = await parser.parse(response.content as string);
  console.log("✅ JsonOutputParser 自动解析的结果:\n");
  console.log(result);
  console.log(`姓名: ${result.name}`);
  console.log(`出生年份: ${result.birth_year}`);
  console.log(`国籍: ${result.nationality}`);
  console.log(`著名理论: ${result.famous_theory}`);
  console.log(`主要成就:`, result.major_achievements);
} catch (error) {
  console.error("❌ 错误:", (error as Error).message);
}

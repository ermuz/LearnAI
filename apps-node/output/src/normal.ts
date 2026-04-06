import { createChatModel } from "@ermuz/node-shared/openai";

// 初始化模型
const model = createChatModel();
const question =
  "请介绍一下爱因斯坦的信息。请以 JSON 格式返回，包含以下字段：name（姓名）、birth_year（出生年份）、nationality（国籍）、major_achievements（主要成就，数组）、famous_theory（著名理论）。";

try {
  console.log("🤔 正在调用大模型...\n");
  const response = await model.invoke(question);
  console.log("✅ 收到响应:\n");
  console.log(response.content);
} catch (error) {
  console.error("❌ 错误:", (error as Error).message);
}

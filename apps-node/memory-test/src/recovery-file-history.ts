import { ChatOpenAI } from "@langchain/openai";
import { FileSystemChatMessageHistory } from "@langchain/community/stores/message/file_system";
import { HumanMessage, MessageType } from "@langchain/core/messages";
import { join } from "node:path";

const model = new ChatOpenAI({
  model: process.env.OPENAI_MODEL,
  apiKey: process.env.OPENAI_API_KEY,
  temperature: 0.7,
  configuration: {
    baseURL: process.env.OPEN_BASE_URL,
  },
});

const RoleMap: Record<MessageType, string> = {
  ai: "助手",
  human: "用户",
  tool: "工具",
  system: "系统设定",
};

const filePath = join(process.cwd(), "chat_history.json");
const sessionId = "user_session_001";

console.log("filePath", filePath);
const history = new FileSystemChatMessageHistory({
  filePath,
  sessionId: sessionId,
});

async function main() {
  console.log("[第三轮对话]");
  const userMessage3 = new HumanMessage("需要哪些食材？");

  await history.addMessage(userMessage3);
  console.log(`用户问：${userMessage3.content}`);
  const response2 = await model.invoke(await history.getMessages());
  console.log(`助手回答：${response2.content}`);
  await history.addMessage(response2);

  // 展示所有历史消息
  console.log("[历史消息记录]");
  const allMessages = await history.getMessages();
  console.log(`共保存了${allMessages.length}条消息：`);
  allMessages.forEach((msg, index) => {
    const type = msg.type;
    const prefix = RoleMap[type];
    console.log(
      ` ${index + 1}. [${prefix}]:${(msg.content as string).substring(0, 50)}...`,
    );
  });
}

main();

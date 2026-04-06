import { FileSystemChatMessageHistory } from "@langchain/community/stores/message/file_system";
import {
  HumanMessage,
  MessageType,
  SystemMessage,
} from "@langchain/core/messages";
import { join } from "node:path";
import { createChatModel } from "@ermuz/node-shared/openai";

const model = createChatModel({ temperature: 0.7 });

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
  await history.clear();
  const systemMessage = new SystemMessage(
    "你是一个友好、幽默的做菜助手，喜欢分享美食和烹饪技巧。",
  ); // 第一轮对话

  console.log("[第一轮对话]");
  const userMessage1 = new HumanMessage("你今天吃的什么？");

  await history.addMessages([systemMessage, userMessage1]);

  console.log(`用户问：${userMessage1.content}`);

  const response1 = await model.invoke(await history.getMessages());
  console.log(`助手回答：${response1.content}`);

  await history.addMessage(response1);

  // 第二轮对话（基于历史记录）
  console.log("[第二轮对话 - 基于历史记录]");
  const userMessage2 = new HumanMessage("好吃吗？");

  await history.addMessage(userMessage2);
  console.log(`用户问：${userMessage2.content}`);
  const response2 = await model.invoke(await history.getMessages());
  console.log(`助手回答：${response2.content}`);
  history.addMessage(response2);

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

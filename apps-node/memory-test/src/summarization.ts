import { InMemoryChatMessageHistory } from "@langchain/core/chat_history";
import {
  AIMessage,
  BaseMessage,
  getBufferString,
  HumanMessage,
  MessageStructure,
  MessageToolSet,
  MessageType,
  SystemMessage,
} from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";

const history = new InMemoryChatMessageHistory();

const maxMessages = 6;

const model = new ChatOpenAI({
  model: process.env.OPENAI_MODEL,
  apiKey: process.env.OPENAI_API_KEY,
  temperature: 0,
  configuration: {
    baseURL: process.env.OPEN_BASE_URL,
  },
});

const messages = [
  { type: "human", content: "我叫张三" },
  { type: "ai", content: "你好张三，很高兴认识你！" },
  { type: "human", content: "我今年25岁" },
  { type: "ai", content: "25岁正是青春年华，有什么我可以帮助你的吗？" },
  { type: "human", content: "我喜欢编程" },
  { type: "ai", content: "编程很有趣！你主要用什么语言？" },
  { type: "human", content: "我住在北京" },
  { type: "ai", content: "北京是个很棒的城市！" },
  { type: "human", content: "我的职业是软件工程师" },
  { type: "ai", content: "软件工程师是个很有前景的职业！" },
];

const summarizeHistory = async (
  messages: Array<BaseMessage<MessageStructure<MessageToolSet>, MessageType>>,
) => {
  const conversationText = getBufferString(messages, "用户", "助手");
  const message = new SystemMessage(`请总结以下对话的核心内容，保留重要信息：

${conversationText}

总结：`);
  const r = await model.invoke([message]);
  return r.content as string;
};

const main = async () => {
  // 追加所有消息到内存中
  for (const message of messages) {
    // history.addAIMessage(message)
    if (message.type === "ai") {
      await history.addMessage(new AIMessage(message.content));
    } else if (message.type === "human") {
      await history.addMessage(new HumanMessage(message.content));
    }
  }
  const allMessages = await history.getMessages();

  if (allMessages.length >= maxMessages) {
    const keepRecent = 2; // 保留最近 2 条消息
    const recentMessages = allMessages.slice(-keepRecent);
    const messagesToSummarize = allMessages.slice(0, -keepRecent);
    console.log("\n💡 历史消息过多，开始总结...");
    console.log(`📝 将被总结的消息数量: ${messagesToSummarize.length}`);
    console.log(`📝 将被保留的消息数量: ${recentMessages.length}`);
    const summary = await summarizeHistory(messagesToSummarize);
    await history.clear();
    for (const msg of recentMessages) {
      await history.addMessage(msg);
    }
    console.log(`\n保留消息数量: ${recentMessages.length}`);
    console.log(
      "保留的消息:",
      recentMessages
        .map((m) => `${m.constructor.name}: ${m.content}`)
        .join("\n  "),
    );
    console.log(`\n总结内容（不包含保留的消息）: ${summary}`);
  } else {
    console.log("\n消息数量未超过阈值，无需总结");
  }
};

main();

import { InMemoryChatMessageHistory } from "@langchain/core/chat_history";
import { AIMessage, HumanMessage } from "@langchain/core/messages";

const history = new InMemoryChatMessageHistory();

const maxMessages = 4;

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

  // 根据消息数来截取
  const trimmedMessages = allMessages.slice(-maxMessages);

  console.log(`保留消息数量: ${trimmedMessages.length}`);
  console.log(
    "保留的消息:\n",
    trimmedMessages
      .map((m) => `${m.constructor.name}: ${m.content}`)
      .join("\n"),
  );
};

main();

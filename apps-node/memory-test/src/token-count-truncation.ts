import { InMemoryChatMessageHistory } from "@langchain/core/chat_history";
import {
  AIMessage,
  BaseMessage,
  HumanMessage,
  MessageStructure,
  MessageToolSet,
  MessageType,
  trimMessages,
} from "@langchain/core/messages";
import { getEncoding, Tiktoken } from "js-tiktoken";

const history = new InMemoryChatMessageHistory();

const maxTokens = 100;

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

function countTokens(
  messages: Array<BaseMessage<MessageStructure<MessageToolSet>, MessageType>>,
  encoder: Tiktoken,
) {
  let total = 0;
  for (const msg of messages) {
    const content =
      typeof msg.content === "string"
        ? msg.content
        : JSON.stringify(msg.content);
    total += encoder.encode(content).length;
  }
  return total;
}

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

  const encoder = getEncoding("cl100k_base");

  // token 截取
  const trimmedMessages = await trimMessages(allMessages, {
    maxTokens,
    strategy: "last",
    tokenCounter: async (msgs) => countTokens(msgs, encoder),
  });

  // 计算实际 token 数用于显示
  const totalTokens = countTokens(trimmedMessages, encoder);
  console.log(`总 token 数:${totalTokens}/${maxTokens}`);
  console.log(`保留消息数量:${trimmedMessages.length}`);
  console.log(
    "保留的消息:",
    trimmedMessages
      .map((m) => {
        const content =
          typeof m.content === "string" ? m.content : JSON.stringify(m.content);
        const tokens = encoder.encode(content).length;
        return `${m.constructor.name} (${tokens} tokens): ${content}`;
      })
      .join("\n  "),
  );
};

main();

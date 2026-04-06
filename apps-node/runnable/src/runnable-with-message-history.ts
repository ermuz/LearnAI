import { createChatModel } from "@ermuz/node-shared/openai";
import { InMemoryChatMessageHistory } from "@langchain/core/chat_history";
import { StringOutputParser } from "@langchain/core/output_parsers";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { RunnableWithMessageHistory } from "@langchain/core/runnables";

const model = createChatModel({
  temperature: 0.3,
});
const prompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    "你是一个简洁、有帮助的中文助手，会用 1-2 句话回答用户问题，重点给出明确、有用的信息。",
  ],
  new MessagesPlaceholder("history"),
  ["human", "{question}"],
]);

const simpleChain = prompt.pipe(model).pipe(new StringOutputParser());

const messageHistories = new Map();

const getMessageHistory = (sessionId: string) => {
  if (!messageHistories.has(sessionId)) {
    messageHistories.set(sessionId, new InMemoryChatMessageHistory());
  }
  return messageHistories.get(sessionId);
};

const chain = new RunnableWithMessageHistory({
  runnable: simpleChain,
  getMessageHistory: (sessionId) => getMessageHistory(sessionId),
  inputMessagesKey: "question",
  historyMessagesKey: "history",
});

// 测试：第一次对话
console.log("--- 第一次对话（提供信息） ---");
const question1 = "我的名字是神光，我来自山东，我喜欢编程、写作、金铲铲。";
console.log("问题: ", question1);

const result1 = await chain.invoke(
  {
    question: question1,
  },
  {
    configurable: {
      sessionId: "user-123",
    },
  },
);
console.log("回答:", result1);
console.log();

// 测试：第二次对话
console.log("--- 第二次对话（询问之前的信息） ---");
const question2 = "我刚才说我来自哪里？";
console.log("问题:", question2);
const result2 = await chain.invoke(
  {
    question: question2,
  },
  {
    configurable: {
      sessionId: "user-123",
    },
  },
);
console.log("回答:", result2);
console.log();

// 测试：第三次对话
console.log("--- 第三次对话（继续询问） ---");
const question3 = "我的爱好是什么？";
console.log("问题:", question3);
const result3 = await chain.invoke(
  {
    question: question3,
  },
  {
    configurable: {
      sessionId: "user-123",
    },
  },
);
console.log("问题: 我的爱好是什么？");
console.log("回答:", result3);
console.log();

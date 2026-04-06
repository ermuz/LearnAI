import { CallbackHandlerMethods } from "@langchain/core/callbacks/base";
import { RunnableLambda, RunnableSequence } from "@langchain/core/runnables";

// 文本处理链：清洗 → 分词 → 统计
const clean = RunnableLambda.from<string, string>((text) => {
  return text.trim().replace(/\s+/g, " ");
});

const tokenize = RunnableLambda.from<string, string[]>((text) => {
  return text.split(" ");
});

const count = RunnableLambda.from<
  string,
  { tokens: string; wordCount: number }
>((tokens) => {
  return { tokens, wordCount: tokens.length };
});

const chain = RunnableSequence.from([clean, tokenize, count]);

// 用 callbacks 观测每一步的输出
const callback: CallbackHandlerMethods = {
  handleChainStart(chain) {
    const step = chain?.id?.[chain.id.length - 1] ?? "unknown";
    console.log(`[START] ${step}`);
  },
  handleChainEnd(output) {
    console.log(`[END]  output=${JSON.stringify(output)}\n`);
  },
  handleChainError(err) {
    console.log(`[ERROR] ${err.message}\n`);
  },
};

const result = await chain.invoke("  hello   world   from   langchain  ", {
  callbacks: [callback],
});

console.log("结果:", result);

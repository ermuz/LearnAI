import "./process.env.js";
import "cheerio";

import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { spinner } from "@clack/prompts";

const model = new ChatOpenAI({
  model: process.env.OPENAI_MODEL,
  apiKey: process.env.OPENAI_API_KEY,
  temperature: 0,
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL,
  },
});

const embeddings = new OpenAIEmbeddings({
  model: process.env.OPENAI_EMBEDDINGS_MODEL,
  apiKey: process.env.OPENAI_API_KEY,
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL,
  },
});

const cheerioLoader = new CheerioWebBaseLoader(
  // 加载整个网页
  "https://juejin.cn/post/7233327509919547452",
  {
    // 筛选
    selector: ".main-area p",
  },
);

const documents = await cheerioLoader.load();

const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 400,
  chunkOverlap: 50,
  separators: ["。", "！", "？"],
});

// 拆分
const splitDocuments = await textSplitter.splitDocuments(documents);

// 文档向量化存储
const vectorStore = await MemoryVectorStore.fromDocuments(
  splitDocuments,
  embeddings,
);

const questions = ["父亲的去世对作者的人生态度产生了怎样的根本性逆转？"];

for (const question of questions) {
  console.log("=".repeat(80));
  console.log(`问题: ${question}`);
  console.log("=".repeat(80));

  const scoreResult = await vectorStore.similaritySearchWithScore(question, 2);

  const context = scoreResult
    .map(([doc], i) => `[片段${i + 1}]\n${doc.pageContent}`)
    .join("\n\n━━━━━\n\n");

  const prompt = `你是一个文章辅助阅读助手，请根据文档内容来解答

		文章内容：
		${context}

		问题：${question}

		`;
  const s = spinner();
  s.start("[AI]思考中");
  const res = await model.invoke(prompt);
  s.stop();
  // s.message(res.content as string);
  console.log("[思考结果]", res.content);
}

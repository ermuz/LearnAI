import { MetricType, MilvusClient } from "@zilliz/milvus2-sdk-node";
import { createChatModel, createEmbeddings } from "@ermuz/node-shared/openai";

const embeddings = createEmbeddings();
const model = createChatModel({ temperature: 0.7 });

const COLLECTION_NAME = "ebook_collection";

const genEmbeddings = (text: string) => embeddings.embedQuery(text);

const client = new MilvusClient({
  address: "127.0.0.1:19530",
});

const retrieveRelevantContent = async (query: string, k = 3) => {
  const queryEmbeddings = await genEmbeddings(query);

  await client.loadCollection({
    collection_name: COLLECTION_NAME,
  });

  const searchResult = await client.search({
    vector: queryEmbeddings,
    collection_name: COLLECTION_NAME,
    limit: k,
    metric_type: MetricType.COSINE,
    output_fields: ["id", "book_id", "chapter_num", "index", "content"],
  });

  return searchResult.results;
};

const answerQuestion = async (query: string, k = 3) => {
  const retrievedContent = await retrieveRelevantContent(query, k);

  const context = retrievedContent
    .map((item, i) => {
      return `[片段 ${i + 1}]
        章节: 第${item.chapter_num}章
        内容: ${item.content}`;
    })
    .join("\n\n━━━━━\n\n"); // 4. 构建 prompt

  const prompt = `你是 Vue 深度研究专家，专注于 Vue 的底层和原理

      请根据以下《Vue 设计与实现》片段内容回答问题：
      ${context}

      用户问题:${query}

      回答要求：
      1. 如果片段中有相关信息，请结合内容给出详细、准确的回答
      2. 可以综合多个片段的内容，提供完整的答案
      3. 如果片段中没有相关信息，请如实告知用户
      4. 回答要准确，不要捏造
      5. 可以引用原文内容来支持你的回答

      AI 助手的回答:`; // 5. 调用 LLM 生成回答

  console.log("\n【AI 回答】");
  const response = await model.invoke(prompt);
  console.log(response.content);
  console.log("\n");

  return response.content;
};

const main = async () => {
  await client.connectPromise;

  const query = "Vue3 的 diff 算法是怎么实现的";

  await answerQuestion(query);
};

main();

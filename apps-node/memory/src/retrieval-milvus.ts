import { MilvusClient, MetricType } from "@zilliz/milvus2-sdk-node";
import { InMemoryChatMessageHistory } from "@langchain/core/chat_history";
import { HumanMessage } from "@langchain/core/messages";
import { createChatModel, createEmbeddings } from "@ermuz/node-shared/openai";
const COLLECTION_NAME = "conversations";
const VECTOR_DIM = 1024;

const embeddings = createEmbeddings({ dimensions: VECTOR_DIM });
const model = createChatModel();

const milvusClient = new MilvusClient({
  address: "127.0.0.1:19530",
});

const getEmbedding = async (text: string) => {
  return embeddings.embedQuery(text);
};

const retrievalRelevantConversation = async (query: string, k = 3) => {
  const embedding = await getEmbedding(query);
  const res = await milvusClient.search({
    collection_name: COLLECTION_NAME,
    vector: embedding,
    metric_type: MetricType.COSINE,
    limit: k,
    output_fields: ["id", "content", "round", "timestamp"],
  });
  return res.results;
};

const main = async () => {
  // 确保已连接
  await milvusClient.connectPromise;

  const history = new InMemoryChatMessageHistory();

  const conversations = [
    { input: "我之前提到的机器学习项目进展如何？" },
    { input: "我周末经常做什么？" },
    { input: "我的职业是什么？" },
  ];

  for (let i = 0; i < conversations.length; i++) {
    const { input } = conversations[i];
    const userMessage = new HumanMessage(input);
    console.log(`\n[第 ${i + 1} 轮对话]`);
    console.log(`用户: ${input}`);
    const retrievalRes = await retrievalRelevantConversation(input);
    console.log("retrievalRes", retrievalRes);
    let relevantHistory = "";
    if (retrievalRes.length) {
      // 构建上下文
      relevantHistory = retrievalRes
        .map((con, idx) => {
          return `[历史对话 ${idx + 1}]
                  轮次: ${con.round}
                  ${con.content}`;
        })
        .join("\n\n━━━━━\n\n");
    } // 2. 构建 prompt（使用检索到的历史作为上下文）
    const contextMessages = relevantHistory
      ? [
          new HumanMessage(
            `相关历史对话：\n${relevantHistory}\n\n用户问题: ${input}`,
          ),
        ]
      : [userMessage];
    console.log(
      "contextMessages",
      contextMessages.map((i) => i.content),
    );
    console.log("\n【AI 回答】");
    await history.addMessage(userMessage);
    const response = await model.invoke(contextMessages); // 保存当前对话到历史消息
    await history.addMessage(response);
    // 4. 将对话保存到 Milvus 向量数据库
    const conversationText = `用户: ${input}\n助手: ${response.content}`;
    const conId = `conv_${Date.now()}_${i + 1}`;
    await milvusClient.insert({
      collection_name: COLLECTION_NAME,
      data: [
        {
          id: conId,
          vector: await getEmbedding(conversationText),
          content: input,
          round: i + 1,
          timestamp: new Date().toISOString(),
        },
      ],
    });
    console.log(`助手: ${response.content}`);
  }
};

main();

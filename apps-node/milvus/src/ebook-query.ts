import { MetricType, MilvusClient } from "@zilliz/milvus2-sdk-node";
import { createEmbeddings } from "@ermuz/node-shared/openai";

const embeddings = createEmbeddings();

const COLLECTION_NAME = "ebook_collection";

const genEmbeddings = (text: string) => embeddings.embedQuery(text);

const client = new MilvusClient({
  address: "127.0.0.1:19530",
});

const main = async () => {
  await client.connectPromise;

  const query = "Vue3 的 diff 算法是怎么实现的";

  const queryEmbeddings = await genEmbeddings(query);

  await client.loadCollection({
    collection_name: COLLECTION_NAME,
  });

  const searchResult = await client.search({
    vector: queryEmbeddings,
    collection_name: COLLECTION_NAME,
    limit: 3,
    metric_type: MetricType.COSINE,
    output_fields: ["id", "book_id", "chapter_num", "index", "content"],
  });
  const rows = searchResult.results.map((item, index) => ({
    "#": index + 1,
    Score: item.score.toFixed(4),
    ID: item.id,
    "Book ID": item.book_id,
    Chapter: `第${item.chapter_num}章`,
    Index: item.index,
    Content: item.content,
  }));
  console.table(rows);
};

main();

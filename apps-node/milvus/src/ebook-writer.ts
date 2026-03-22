import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  DataType,
  IndexType,
  MetricType,
  MilvusClient,
} from "@zilliz/milvus2-sdk-node";

import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { OpenAIEmbeddings } from "@langchain/openai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

import chalk from "chalk";
import { Presets, SingleBar } from "cli-progress";
import ora from "ora";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PDF_PATH = path.join(
  __dirname,
  "..",
  "(图灵原创) 霍春阳 - Vue.js设计与实现-人民邮电出版社 (2022).pdf",
);

const log = {
  success: (msg: string) => process.stdout.write(chalk.green(msg)),
  info: (msg: string) => process.stdout.write(chalk.cyan(msg)),
  dim: (msg: string) => process.stdout.write(chalk.dim(msg)),
  newline: () => process.stdout.write("\n"),
};

const COLLECTION_NAME = "ebook_collection";
const VECTOR_DIM = 1024;
const CHUNK_SIZE = 500; // 拆分到 500 个字符
const client = new MilvusClient({
  address: "127.0.0.1:19530",
});

// 声明 向量嵌入模型
const embeddings = new OpenAIEmbeddings({
  model: process.env.OPENAI_EMBEDDINGS_MODEL,
  apiKey: process.env.OPENAI_API_KEY,
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL,
  },
  dimensions: VECTOR_DIM,
});

const getEmbeddings = (text: string) => embeddings.embedQuery(text);

const ensureCollection = async () => {
  const hasCollection = await client.hasCollection({
    collection_name: COLLECTION_NAME,
  });
  if (!hasCollection.value) {
    await client.createCollection({
      collection_name: COLLECTION_NAME,
      fields: [
        {
          name: "id",
          data_type: DataType.VarChar,
          max_length: 100,
          is_primary_key: true,
        },
        {
          name: "book_id",
          data_type: DataType.VarChar,
          max_length: 100,
        },
        { name: "book_name", data_type: DataType.VarChar, max_length: 200 },
        { name: "chapter_num", data_type: DataType.Int32 },
        { name: "index", data_type: DataType.Int32 },
        { name: "content", data_type: DataType.VarChar, max_length: 10000 },
        { name: "vector", data_type: DataType.FloatVector, dim: VECTOR_DIM },
      ],
    });
  }
  await client.createIndex({
    collection_name: COLLECTION_NAME,
    field_name: "vector",
    index_type: IndexType.IVF_FLAT,
    // 余弦相似度
    metric_type: MetricType.COSINE,
    params: {
      nlist: 1024,
    },
  });
  await client.loadCollection({
    collection_name: COLLECTION_NAME,
  });
};

const insertChunkBatch = async (
  chunks: string[],
  bookId: number,
  pageNum: number,
) => {
  const insertData = await Promise.all(
    chunks.map(async (chunk, chunkIndex) => {
      const vector = await getEmbeddings(chunk);
      return {
        id: `${bookId}_${pageNum}_${chunkIndex}`,
        book_id: bookId,
        book_name: "vue 设计与实现",
        chapter_num: pageNum,
        index: chunkIndex,
        content: chunk,
        vector,
      };
    }),
  );
  await client.insert({
    collection_name: COLLECTION_NAME,
    data: insertData,
  });
};

// TODO: 这里换成更加智能的加载和处理方式
const loadAndProcessPDFStreaming = async (bookId: number) => {
  const loadSpinner = ora({
    text: chalk.cyan("正在加载 PDF 文档…"),
    color: "cyan",
  }).start();

  const pdfLoader = new PDFLoader(PDF_PATH, { splitPages: true });
  const documents = await pdfLoader.load();
  const totalPages = documents.length;

  loadSpinner.succeed(chalk.green(`已加载 ${totalPages} 页`));

  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: CHUNK_SIZE,
    chunkOverlap: 50,
  });

  if (totalPages === 0) {
    log.dim("  无页面需要写入，跳过。");
    log.newline();
    return;
  }

  const bar = new SingleBar(
    {
      format:
        chalk.cyan(" 写入进度 ") +
        "|{bar}" +
        chalk.dim("|") +
        " {percentage}% | {value}/{total} 页",
      barCompleteChar: "█",
      barIncompleteChar: "░",
      hideCursor: true,
    },
    Presets.shades_classic,
  );
  bar.start(totalPages, 0);

  for (let i = 0; i < documents.length; i++) {
    const page = documents[i];
    const content = page.pageContent;
    const chunks = await textSplitter.splitText(content);
    await insertChunkBatch(chunks, bookId, i + 1);
    bar.update(i + 1);
  }
  bar.stop();
  log.success("  ✓ 分块与写入完成");
  log.newline();
};

async function main() {
  const connectSpinner = ora({
    text: chalk.cyan("正在连接 Milvus…"),
    color: "cyan",
  }).start();
  await client.connectPromise;
  connectSpinner.succeed(chalk.green("已连接 Milvus"));

  const collectionSpinner = ora({
    text: chalk.cyan("检查/创建集合与索引…"),
    color: "cyan",
  }).start();
  const bookId = 1;
  await ensureCollection();
  collectionSpinner.succeed(chalk.green("集合就绪"));
  log.newline();

  await loadAndProcessPDFStreaming(bookId);

  log.success("✨ 脚本执行完毕");
  log.newline();
}
main();

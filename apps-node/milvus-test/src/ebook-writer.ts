import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { Document } from "@langchain/core/documents";
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
import pdfParse from "pdf-parse";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PDF_PATH = path.join(__dirname, "..", "vue 设计与实现.pdf");

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

const loadAndProcessPDFStreaming = async (bookId: number) => {
  const loadSpinner = ora({
    text: chalk.cyan("正在加载 PDF 文档…"),
    color: "cyan",
  }).start();

  const pdfLoader = new PDFLoader(PDF_PATH, { splitPages: true });
  let documents = await pdfLoader.load();
  let totalPages = documents.length;

  if (totalPages === 0) {
    try {
      loadSpinner.text = chalk.cyan("PDFLoader 未解析到页面，改用 pdf-parse…");
      const buffer = await readFile(PDF_PATH);
      const { numpages, text } = await pdfParse(buffer);
      if (!text?.trim() || numpages < 1) {
        loadSpinner.fail(
          chalk.red("无法从 PDF 中提取文本（可能为扫描版或格式不支持）"),
        );
        return;
      }
      const perPage = Math.max(1, Math.ceil(text.length / numpages));
      documents = Array.from(
        { length: numpages },
        (_, i) =>
          new Document({
            pageContent:
              text.slice(i * perPage, (i + 1) * perPage).trim() || " ",
            metadata: { loc: { pageNumber: i + 1 } },
          }),
      );
      totalPages = documents.length;
      loadSpinner.succeed(
        chalk.green(`已通过 pdf-parse 加载 ${totalPages} 页`),
      );
    } catch (err) {
      loadSpinner.fail(
        chalk.red(
          "pdf-parse 解析失败: " +
            (err instanceof Error ? err.message : String(err)),
        ),
      );
      return;
    }
  } else {
    loadSpinner.succeed(chalk.green(`已加载 ${totalPages} 页`));
  }

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

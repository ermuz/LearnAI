import { config } from "dotenv";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

config({ path: join(root, ".env") });
config({ path: join(root, ".env.local"), override: true });

import { ChatOpenAI } from "@langchain/openai";

const model = new ChatOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  model: "qwen-coder-turbo",
  configuration: {
    baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  },
});

const response = await model.invoke("Hello, how are you?");

console.log(response.content);

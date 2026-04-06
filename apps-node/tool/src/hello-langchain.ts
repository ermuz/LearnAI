import { loadAppEnv, createChatModel } from "@ermuz/node-shared";

loadAppEnv(import.meta.url, { includeLocal: true });

const model = createChatModel({
  model: "qwen-coder-turbo",
  baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
});

const response = await model.invoke("Hello, how are you?");

console.log(response.content);

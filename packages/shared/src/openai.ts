import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";

type SharedOpenAIConfig = {
  apiKey: string | undefined;
  configuration: {
    baseURL: string | undefined;
  };
};

type CreateChatModelOptions = {
  model?: string;
  apiKey?: string;
  baseURL?: string;
  temperature?: number;
};

type CreateEmbeddingsOptions = {
  model?: string;
  apiKey?: string;
  baseURL?: string;
  dimensions?: number;
};

const openAIEnv = {
  model: process.env.OPENAI_MODEL,
  embeddingsModel: process.env.OPENAI_EMBEDDINGS_MODEL,
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
};

const sharedConfig: SharedOpenAIConfig = {
  apiKey: openAIEnv.apiKey,
  configuration: {
    baseURL: openAIEnv.baseURL,
  },
};

export const createChatModel = (options: CreateChatModelOptions = {}) =>
  new ChatOpenAI({
    model: options.model ?? openAIEnv.model,
    temperature: options.temperature ?? 0,
    apiKey: options.apiKey ?? sharedConfig.apiKey,
    configuration: {
      baseURL: options.baseURL ?? sharedConfig.configuration.baseURL,
    },
  });

export const createEmbeddings = (options: CreateEmbeddingsOptions = {}) =>
  new OpenAIEmbeddings({
    model: options.model ?? openAIEnv.embeddingsModel,
    apiKey: options.apiKey ?? sharedConfig.apiKey,
    configuration: {
      baseURL: options.baseURL ?? sharedConfig.configuration.baseURL,
    },
    ...(options.dimensions ? { dimensions: options.dimensions } : {}),
  });

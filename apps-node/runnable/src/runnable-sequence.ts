import { spinner } from "@clack/prompts";
import { createChatModel } from "@ermuz/node-shared/openai";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import z from "zod";

const model = createChatModel();

const schema = z.object({
  translation: z.string().describe("翻译后的英文文本"),
  keywords: z.array(z.string()).length(3).describe("从原文中提取的3个关键词"),
});

const outputParser = StructuredOutputParser.fromZodSchema(schema);

const promptTemplate = PromptTemplate.fromTemplate(
  "将一下文本翻译成英文并提取3个关键词：\n\n{input}\n\n{format_instructions}",
);

const chain = RunnableSequence.from([promptTemplate, model, outputParser]);

const input = {
  input: "LangChain 是一个强大的 AI 应用开发框架",
  format_instructions: outputParser.getFormatInstructions(),
};
const s = spinner();

s.start("AI正在思考...");

const parsed = await chain.invoke(input);
s.stop(`翻译结果：${parsed.translation}\n关键词：${parsed.keywords}`);

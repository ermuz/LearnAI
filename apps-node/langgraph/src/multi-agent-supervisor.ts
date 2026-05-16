import { createSupervisor } from "@langchain/langgraph-supervisor";
import type { CreateSupervisorParams } from "@langchain/langgraph-supervisor";
import type {
  AnnotationRoot,
  BinaryOperatorAggregate,
  Messages,
} from "@langchain/langgraph";
import type {
  BaseMessage,
  MessageStructure,
  MessageType,
} from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import { createAgent, HumanMessage, tool } from "langchain";
import z from "zod";

/** 与 createSupervisor 默认 state 一致（见 @langchain/langgraph-supervisor 泛型默认项）。 */
type DefaultSupervisorRoot = AnnotationRoot<{
  messages: BinaryOperatorAggregate<
    BaseMessage<MessageStructure, MessageType>[],
    Messages
  >;
}>;

function normCity(city: string) {
  return String(city).trim();
}

const weatherTable = {
  杭州: { summary: "多云转小雨", tempHighC: 22, tempLowC: 15, aqi: "良" },
  北京: { summary: "晴", tempHighC: 26, tempLowC: 12, aqi: "轻度污染" },
  上海: { summary: "阴", tempHighC: 20, tempLowC: 16, aqi: "良" },
};

const triviaTable = {
  杭州: "西湖文化景观是世界文化遗产之一。",
  北京: "故宫是世界上现存规模最大的古代宫殿建筑群之一。",
  上海: "外滩万国建筑博览群是近代城市历史的缩影。",
};

/** 查某地当日天气摘要（模拟） */
export function lookupWeather(city: string) {
  const c = normCity(city);
  const w = weatherTable[c as keyof typeof weatherTable];
  if (!w) {
    return JSON.stringify({
      city: c,
      summary: "暂无该城市数据，以下为占位",
      tempHighC: 20,
      tempLowC: 12,
      aqi: "—",
    });
  }
  return JSON.stringify({ city: c, ...w });
}

/** 查与某城市相关的一句小知识（模拟） */
export function lookupCityTrivia(city: string) {
  const c = normCity(city);
  const line = triviaTable[c as keyof typeof triviaTable];
  return JSON.stringify({
    city: c,
    trivia: line ?? `没有为「${c}」准备内置小知识，可换杭州/北京/上海试试。`,
  });
}

const model = new ChatOpenAI({
  modelName: process.env.OPENAI_MODEL,
  apiKey: process.env.OPENAI_API_KEY,
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL,
  },
});

const lookupWeatherTool = tool(async ({ city }) => lookupWeather(city), {
  name: "lookup_weather",
  description: "查询某城市当日天气概况（气温区间、天气、空气质量等）。",
  schema: z.object({
    city: z.string().describe("城市名，如 杭州"),
  }),
});

const lookupCityTriviaTool = tool(async ({ city }) => lookupCityTrivia(city), {
  name: "lookup_city_trivia",
  description: "查询与某城市相关的一句趣味知识。",
  schema: z.object({
    city: z.string().describe("城市名，如 杭州"),
  }),
});

const weatherAgent = createAgent({
  name: "weather-agent",
  description: "A weather agent that can get the weather of a city",
  model,
  tools: [lookupWeatherTool],
  systemPrompt:
    "你是一个天气助手，可以查询某城市当日天气概况（气温区间、天气、空气质量等）。",
});

const cityTriviaAgent = createAgent({
  name: "city-trivia-agent",
  description: "A city trivia agent that can get the trivia of a city",
  model,
  tools: [lookupCityTriviaTool],
  systemPrompt: "你是一个城市百科助手，可以查询与某城市相关的一句趣味知识。",
});

const supervisor = createSupervisor({
  agents: [
    weatherAgent.graph,
    cityTriviaAgent.graph,
  ] as unknown as CreateSupervisorParams<DefaultSupervisorRoot>["agents"],
  llm: model,
  prompt: `你是调度员，只负责选人，不要自己报气温、也不要自己讲城市百科。

	- 问天气、气温、下不下雨、空气 → 用 weather_agent
	- 问小知识、名胜、历史、一句介绍 → 用 trivia_agent
	`,
});

const app = supervisor.compile();

const input = {
  messages: [
    new HumanMessage("查一下杭州的天气，再讲一条和杭州有关的小知识。"),
  ],
};

const result = await app.invoke(input);
console.log(result.messages.at(-1)?.content);

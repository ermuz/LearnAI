import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableLambda, RunnableMap } from "@langchain/core/runnables";

const addOne = RunnableLambda.from<{ num: number }, number>(
  (input) => input.num + 1,
);
const multiplyByTwo = RunnableLambda.from<{ num: number }, number>(
  (input) => input.num * 2,
);
const square = RunnableLambda.from<{ num: number }, number>(
  (input) => input.num * input.num,
);

const greetTemplate = PromptTemplate.fromTemplate("你好，{name}");

const wetherTemplate = PromptTemplate.fromTemplate("今天天气{weather}");

const runnableMap = RunnableMap.from({
  addOne,
  multiplyByTwo,
  square,
  greetTemplate,
  wetherTemplate,
});

const result = await runnableMap.invoke({
  name: "ermuz",
  weather: "晴朗",
  num: 5,
});

console.log("结果", result);

import { RunnableLambda } from "@langchain/core/runnables";

const addOne = RunnableLambda.from<number, number>((input) => {
  console.log("输入", input);
  return input + 1;
});

const multiplyByTwo = RunnableLambda.from<number, number>((input) => {
  console.log("输入", input);
  return input * 2;
});
const chain = addOne.pipe(multiplyByTwo).pipe(addOne);

const result = await chain.invoke(5);
console.log("最终结果", result);

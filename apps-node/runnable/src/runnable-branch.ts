import { RunnableBranch, RunnableLambda } from "@langchain/core/runnables";

const isPositive = RunnableLambda.from<number, boolean>((input) => input > 0);
const isNegative = RunnableLambda.from<number, boolean>((input) => input < 0);
const isEven = RunnableLambda.from<number, boolean>((input) => input % 2 === 0);

// 创建分支处理函数
const handlePositive = RunnableLambda.from<number, string>(
  (input) => `正数: ${input} + 10 = ${input + 10}`,
);
const handleNegative = RunnableLambda.from<number, string>(
  (input) => `负数: ${input} - 10 = ${input - 10}`,
);
const handleEven = RunnableLambda.from<number, string>(
  (input) => `偶数: ${input} * 2 = ${input * 2}`,
);
const handleDefault = RunnableLambda.from((input) => `默认: ${input}`);

const branch = RunnableBranch.from([
  [isNegative, handleNegative],
  [isPositive, handlePositive],
  [isEven, handleEven],
  handleDefault,
]);

// 测试不同的输入
const testCases = [5, -3, 4, 0];

for (const testCase of testCases) {
  const result = await branch.invoke(testCase);
  console.log(`输入: ${testCase} => ${result}`);
}

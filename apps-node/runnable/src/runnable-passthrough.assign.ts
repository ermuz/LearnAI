import {
  RunnablePassthrough,
  RunnableSequence,
} from "@langchain/core/runnables";

const chain = RunnableSequence.from([
  (input) => ({ concept: input }),
  // 使用 RunnablePassthrough.assign 来保留第一步的输出，并在第二步中进行处理
  RunnablePassthrough.assign({
    original: new RunnablePassthrough(),
    processed: (obj) => ({
      concept: input,
      upper: obj.concept.toUpperCase(),
      length: obj.concept.length,
    }),
  }),
]);
const input = "ermuz";

const result = await chain.invoke(input);
console.log(result);

// {
//   concept: 'ermuz', // 这里是第一步的输出
//   original: { concept: 'ermuz' },
//   processed: { concept: 'ermuz', upper: 'ERMUZ', length: 5 }
// }

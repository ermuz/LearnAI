import {
  RunnableLambda,
  RunnableMap,
  RunnablePassthrough,
  RunnableSequence,
} from "@langchain/core/runnables";

const chain = RunnableSequence.from([
  RunnableLambda.from<string, { concept: string }>((input) => ({
    concept: input,
  })),
  RunnableMap.from<{ concept: string }>({
    original: new RunnablePassthrough(),
    processed: RunnableLambda.from((obj) => ({
      concept: obj.concept,
      upper: obj.concept.toUpperCase(),
      length: obj.concept.length,
    })),
  }),
]);
const input = "ermuz";

const result = await chain.invoke(input);
console.log(result);
// {
//   original: { concept: 'ermuz' },
//   processed: { concept: 'ermuz', upper: 'ERMUZ', length: 5 }
// }

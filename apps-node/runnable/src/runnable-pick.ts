import { RunnablePick, RunnableSequence } from "@langchain/core/runnables";

const inputData = {
  name: "ermuz",
  age: 30,
  city: "北京",
  country: "中国",
  email: "ermuz@example.com",
  phone: "+86-13800138000",
};

const chain = RunnableSequence.from([
  (input: typeof inputData) => ({
    ...input,
    fullInfo: `${input.name}，${input.age}岁，来自${input.city}`,
  }),
  new RunnablePick(["name", "fullInfo"]),
]);

const result = await chain.invoke(inputData);
console.log(result);
// { name: 'ermuz', fullInfo: 'ermuz，30岁，来自北京' }

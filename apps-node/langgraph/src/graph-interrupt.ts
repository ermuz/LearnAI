import {
  Annotation,
  Command,
  END,
  interrupt,
  MemorySaver,
  START,
  StateGraph,
} from "@langchain/langgraph";

import { createInterface } from "node:readline/promises";

const StateAnnotations = Annotation.Root({
  actionSummary: Annotation<string>({
    reducer: (_pre, next) => next,
    default: () => "",
  }),
  userInput: Annotation<string>({
    reducer: (_pre, next) => next,
    default: () => "",
  }),
});

/** 展示一笔待确认的转账 */
const showTransfer = () => ({
  actionSummary: "向张三转账 ¥100（模拟，不会真扣款）",
});

/** 停在这里等人输入；resume 的值会写进 userInput */
const waitConfirm = (state: typeof StateAnnotations.State) => {
  const text = interrupt({
    hint: "终端里输入「确认」或备注后回车，图才会继续",
    actionSummary: state.actionSummary,
  });
  return { userInput: String(text) };
};

const graph = new StateGraph(StateAnnotations)
  .addNode("showTransfer", showTransfer)
  .addNode("waitConfirm", waitConfirm)
  .addEdge(START, "showTransfer")
  .addEdge("showTransfer", "waitConfirm")
  .addEdge("waitConfirm", END)
  .compile({ checkpointer: new MemorySaver() });

const config = {
  configurable: {
    thread_id: "interrupt",
  },
};

graph.invoke({}, config);

const rl = createInterface({ input: process.stdin, output: process.stdout });
const line = (await rl.question("> ")).trim();
console.log("line:", line);
await rl.close();

if (!line) {
  console.error("未输入，退出。");
  process.exit(1);
}

const done = await graph.invoke(new Command({ resume: line }), config);
console.log("结果：", done);

import {
  Annotation,
  END,
  MemorySaver,
  START,
  StateGraph,
} from "@langchain/langgraph";

const StateAnnotations = Annotation.Root({
  count: Annotation<number>({
    reducer: (_pre, next) => next,
    default: () => 0,
  }),
  message: Annotation<string>({
    reducer: (_pre, next) => next,
    default: () => "",
  }),
});

/** 每跑一轮图，给「当前会话」访问次数 +1 */
function recordVisit(state: typeof StateAnnotations.State) {
  const count = state.count + 1;
  const message =
    count === 1
      ? "这是你在本会话里第 1 次进入。"
      : `这是你在本会话里第 ${count} 次进入`;
  return { count, message };
}

const checkpointer = new MemorySaver();

const graph = new StateGraph(StateAnnotations)
  .addNode("recordVisit", recordVisit)
  .addEdge(START, "recordVisit")
  .addEdge("recordVisit", END)
  .compile({ checkpointer });

const lisi = {
  configurable: {
    thread_id: "lisi",
  },
};
const wangwu = {
  configurable: {
    // 区分上下文
    thread_id: "wangwu",
  },
};

const lisiResult1 = await graph.invoke({}, lisi);
const lisiResult2 = await graph.invoke({}, lisi);
const lisiResult3 = await graph.invoke({}, lisi);
const wangwuResult1 = await graph.invoke({}, wangwu);
const wangwuResult2 = await graph.invoke({}, wangwu);
const wangwuResult3 = await graph.invoke({}, wangwu);
console.log("lisiResult1:", lisiResult1);
console.log("lisiResult2:", lisiResult2);
console.log("lisiResult3:", lisiResult3);
console.log("wangwuResult1:", wangwuResult1);
console.log("wangwuResult2:", wangwuResult2);
console.log("wangwuResult3:", wangwuResult3);

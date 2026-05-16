import { Annotation, END, START, StateGraph } from "@langchain/langgraph";

const StateAnnotations = Annotation.Root({
  query: Annotation<string>({
    reducer: (_pre, next) => next,
    default: () => "",
  }),
  route: Annotation<string>({
    reducer: (_pre, next) => next,
    default: () => "chat",
  }),
  answer: Annotation<string>({
    reducer: (_pre, next) => next,
    default: () => "",
  }),
});

const router = (state: typeof StateAnnotations.State) => {
  const query = state.query;
  if (/[+\-*/]/g.test(query)) {
    return {
      route: "math",
    };
  }
  return {
    route: "chat",
  };
};

const math = (state: typeof StateAnnotations.State) => {
  try {
    return {
      answer: eval(state.query),
    };
  } catch (error) {
    return {
      answer: `Error: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
};

const chat = (state: typeof StateAnnotations.State) => {
  return {
    answer: `Chat: ${state.query}`,
  };
};

const graph = new StateGraph(StateAnnotations)
  .addNode("router", router)
  .addNode("math", math)
  .addNode("chat", chat)
  .addEdge(START, "router")
  .addConditionalEdges("router", (state) => state.route, {
    math: "math",
    chat: "chat",
  })
  .addEdge("chat", END)
  .addEdge("math", END)
  .compile();

// 导出为 Mermaid：可复制到 https://mermaid.live 或 Markdown 的 ```mermaid 代码块
const drawable = await graph.getGraphAsync();
const mermaid = drawable.drawMermaid({ withStyles: true });
console.log(mermaid);

console.log("result:", await graph.invoke({ query: "你好" }));

console.log("result:", await graph.invoke({ query: "10 * 8" }));

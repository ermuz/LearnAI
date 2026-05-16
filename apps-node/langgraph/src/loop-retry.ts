import { Annotation, END, START, StateGraph } from "@langchain/langgraph";

const StateAnnotations = Annotation.Root({
  tries: Annotation<number>({
    reducer: (_pre, next) => next,
    default: () => 0,
  }),
  success: Annotation<boolean>({
    reducer: (_pre, next) => next,
    default: () => false,
  }),
  message: Annotation<string>({
    reducer: (_pre, next) => next,
    default: () => "",
  }),
});

const attempt = (state: typeof StateAnnotations.State) => {
  const tries = state.tries + 1;
  const success = tries >= 3;

  console.log(`第${tries}次尝试，${success ? "成功" : "失败"}`);

  return {
    tries,
    success,
    message: success ? `第 ${tries} 次成功` : `第 ${tries}次失败，继续重试`,
  };
};

const graph = new StateGraph(StateAnnotations)
  .addNode("attempt", attempt)
  .addEdge(START, "attempt")
  .addConditionalEdges(
    "attempt",
    (state) => (state.success ? "done" : "retry"),
    {
      done: END,
      retry: "attempt",
    },
  )
  .compile();

const result = await graph.invoke({});
console.log("result:", result);

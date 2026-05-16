import { loadAppEnv } from "@ermuz/node-shared/env";

loadAppEnv(import.meta.url, { includeLocal: true });
const main = async () => {
  // await import("./basic-graph.js");
  // await import("./conditional-routing.js");
  // await import("./loop-retry.js");
  // await import("./checkpointer-memory.js");
  // await import("./graph-interrupt.js");
  // await import("./prebuilt-tool-node.js");
  // await import("./prebuilt-agent.js");
  await import("./multi-agent-supervisor.js");
};

await main();

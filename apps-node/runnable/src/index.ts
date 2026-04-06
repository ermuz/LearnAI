import { loadAppEnv } from "@ermuz/node-shared/env";

loadAppEnv(import.meta.url, { includeLocal: false });

const main = async () => {
  // await import("./before")
  // await import("./runnable-sequence");
  // await import("./pipe");
  // await import("./runnable-lambda");
  // await import("./runnable-branch");
  // await import("./router-runnable");
  // await import("./runnable-passthrough");
  // await import("./runnable-passthrough.assign");
  // await import("./runnable-each");
  // await import("./runnable-pick");
  // await import("./runnable-with-message-history");
  // await import("./mcp.js");
  // await import("./runnable-with-callback.js");
  // await import("./runnable-with-fallback");
  await import("./runnable-with-retry.js");
};

main();

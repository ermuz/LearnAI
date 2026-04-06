import { loadAppEnv } from "@ermuz/node-shared/env";

loadAppEnv(import.meta.url, { includeLocal: true });

const main = async () => {
  // await import("./template1.js");
  // await import("./partial.js");
  await import("./chat.js");
};

await main();

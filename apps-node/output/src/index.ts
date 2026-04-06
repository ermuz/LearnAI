import { loadAppEnv } from "@ermuz/node-shared/env";

loadAppEnv(import.meta.url, { includeLocal: true });

const main = async () => {
  // await import("./normal.js");
  // await import("./json-parser.js");
  // await import("./structured-parser.js");
  // await import("./with-structured-output.js");
  // await import("./stream.js");
  // await import("./stream-with-structured.js");
  // await import("./stream-structured-parser.js");
  // await import("./stream-tool-calls-parser.js");
  await import("./xml-output-parser.js");
};

await main();

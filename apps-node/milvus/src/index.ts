import { loadAppEnv } from "@ermuz/node-shared/env";

loadAppEnv(import.meta.url, { includeLocal: false });

const main = async () => {
  // await import("./insert.js");
  // await import("./ebook-writer.js");
  // await import("./ebook-query.js");
  await import("./ebook-reader-rag.js");
};

await main();

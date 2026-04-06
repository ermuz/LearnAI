import { loadAppEnv } from "@ermuz/node-shared/env";

loadAppEnv(import.meta.url, { includeLocal: false });

const main = async () => {
  // await import("./memory-history.js");
  // await import("./file-history.js");
  // await import("./recovery-file-history.js");
  // await import("./message-count-truncation.js");
  // await import("./token-count-truncation.js");
  // await import("./summarization.js");
  // await import("./insert-milvus.js");
  await import("./retrieval-milvus.js");
};

await main();

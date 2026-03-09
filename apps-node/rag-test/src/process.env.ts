import { config } from "dotenv";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
config({
  path: [join(root, ".env"), join(root, ".env.local")],
  override: true,
  debug: true,
});

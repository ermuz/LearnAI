import { config } from "dotenv";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

type LoadAppEnvOptions = {
  rootRelativeToModule?: string;
  includeLocal?: boolean;
  debug?: boolean;
  override?: boolean;
};

export const loadAppEnv = (
  moduleUrl: string,
  options: LoadAppEnvOptions = {},
) => {
  const {
    rootRelativeToModule = "..",
    includeLocal = true,
    debug = true,
    override = true,
  } = options;

  const dir = dirname(fileURLToPath(moduleUrl));
  const root = join(dir, rootRelativeToModule);
  const paths = includeLocal
    ? [join(root, ".env"), join(root, ".env.local")]
    : [join(root, ".env")];

  return config({
    path: paths,
    override,
    debug,
  });
};

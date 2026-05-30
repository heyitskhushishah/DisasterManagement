import path from "node:path";
import { register } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));

register(pathToFileURL(path.join(scriptsDir, "ts-paths-loader.mjs")).href);

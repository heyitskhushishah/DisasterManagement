import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

const resolveAliasPath = (specifier) => {
  const relativePath = specifier.slice(2);
  const basePath = path.join(projectRoot, relativePath);

  if (fs.existsSync(basePath)) {
    return basePath;
  }

  const tsPath = `${basePath}.ts`;
  if (fs.existsSync(tsPath)) {
    return tsPath;
  }

  const indexTsPath = path.join(basePath, "index.ts");
  if (fs.existsSync(indexTsPath)) {
    return indexTsPath;
  }

  return basePath;
};

export const resolve = (specifier, context, nextResolve) => {
  if (specifier.startsWith("@/")) {
    const resolvedPath = resolveAliasPath(specifier);
    return nextResolve(pathToFileURL(resolvedPath).href, context);
  }

  return nextResolve(specifier, context);
};

import { cpSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const src = resolve(root, "node_modules/@wllama/wllama/esm");
const dest = resolve(root, "public/wasm");

for (const dir of ["single-thread", "multi-thread"]) {
  const srcDir = resolve(src, dir);
  const destDir = resolve(dest, dir);
  if (existsSync(srcDir)) {
    cpSync(srcDir, destDir, { recursive: true });
    console.log(`Copied ${dir} wasm files`);
  }
}

import fs from "fs";
import path from "path";

const env = process.env.NODE_ENV || "development";

const srcFile = env === "production" ? ".envprod" : ".envdev";
const destFile = ".env";

const srcPath = path.resolve(__dirname, srcFile);
const destPath = path.resolve(__dirname, destFile);

if (!fs.existsSync(srcPath)) {
  console.error(`Source file ${srcFile} not found.`);
  process.exit(1);
}

fs.copyFileSync(srcPath, destPath);
console.log(`Copied ${srcFile} to ${destFile}`);

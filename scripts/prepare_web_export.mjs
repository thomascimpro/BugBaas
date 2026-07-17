import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const exportRoot = path.resolve("site", "public", "game");
const indexPath = path.join(exportRoot, "index.html");
const bundleRoot = path.join(exportRoot, "_expo", "static", "js", "web");

const indexHtml = await readFile(indexPath, "utf8");
await writeFile(indexPath, indexHtml.replaceAll('src="/_expo/', 'src="/game/_expo/'));

for (const filename of await readdir(bundleRoot)) {
  if (!filename.endsWith(".js")) continue;
  const bundlePath = path.join(bundleRoot, filename);
  const bundle = await readFile(bundlePath, "utf8");
  await writeFile(bundlePath, bundle.replaceAll('uri:"/assets/', 'uri:"/game/assets/'));
}

// Entry program for make.fun news-image-20261124.
// Copies the pre-rendered front-page image (entry.png, built fresh in
// this session from tools/scene.html) to the grader's output directory.
// Standard library only, no network, deterministic: the same bytes
// every run.
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
mkdirSync(outDir, { recursive: true });
const here = dirname(fileURLToPath(import.meta.url));
copyFileSync(join(here, "entry.png"), join(outDir, "entry.png"));

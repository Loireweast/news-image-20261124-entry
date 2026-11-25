// Render tools/scene.html to entry.png with headless Chrome over the
// DevTools pipe (no loopback: --remote-debugging-pipe speaks over stdio
// fds 3 and 4, messages are JSON frames terminated by a NUL byte).
// Usage: node tools/render.mjs [scene.html] [entry.png]
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const CHROME = "/opt/meta-chromium/chrome";
const POLICY = "/tmp/render-test/webgl-policy.txt";
const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "..");
const sceneFile = path.resolve(process.argv[2] ?? path.join(repo, "tools", "scene.html"));
const outFile = path.resolve(process.argv[3] ?? path.join(repo, "entry.png"));
const WIDTH = 1024;
const HEIGHT = 1024;

const policySha = crypto.createHash("sha256").update(fs.readFileSync(POLICY)).digest("hex");

const chrome = spawn(CHROME, [
  "--headless=new",
  "--disable-gpu",
  "--no-sandbox",
  "--no-first-run",
  "--user-data-dir=/tmp/render-test/profile-render",
  "--remote-debugging-pipe",
  "--allow-file-access-from-files",
  "--force-device-scale-factor=1",
  "--hide-scrollbars",
  "--window-size=" + WIDTH + "," + HEIGHT,
  "--hatch-webgl-allowed-domains-file=" + POLICY,
  "--hatch-webgl-allowed-domains-sha256=" + policySha,
], { stdio: ["ignore", "pipe", "pipe", "pipe", "pipe"] });

chrome.stderr.on("data", () => {}); // dbus noise; ignore

let buf = Buffer.alloc(0);
let nextId = 1;
const pending = new Map();
let finished = false;

function send(method, params, sessionId) {
  const id = nextId++;
  const msg = { id, method, params: params || {} };
  if (sessionId) msg.sessionId = sessionId;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    chrome.stdio[3].write(JSON.stringify(msg) + "\0");
  });
}

function fail(msg) {
  if (finished) return;
  finished = true;
  console.error("render failed: " + msg);
  try { chrome.kill("SIGKILL"); } catch {}
  process.exit(1);
}

function done(bytes) {
  if (finished) return;
  finished = true;
  console.log("wrote " + outFile + " (" + bytes + " bytes)");
  try { chrome.kill("SIGKILL"); } catch {}
  process.exit(0);
}

let navigated = false;
chrome.stdio[4].on("data", (chunk) => {
  buf = Buffer.concat([buf, chunk]);
  let idx;
  while ((idx = buf.indexOf(0)) !== -1) {
    const raw = buf.slice(0, idx).toString("utf8");
    buf = buf.slice(idx + 1);
    if (!raw.trim()) continue;
    let msg;
    try { msg = JSON.parse(raw); } catch { continue; }
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(JSON.stringify(msg.error)));
      else resolve(msg.result);
    } else if (msg.method === "Target.targetCreated" && msg.params.targetInfo.type === "page") {
      void attach(msg.params.targetInfo.targetId);
    }
  }
});

async function attach(targetId) {
  if (navigated) return;
  navigated = true;
  try {
    const r = await send("Target.attachToTarget", { targetId, flatten: true });
    const sessionId = r.sessionId;
    await send("Emulation.setDeviceMetricsOverride", {
      width: WIDTH, height: HEIGHT, deviceScaleFactor: 1, mobile: false,
    }, sessionId);
    await send("Page.enable", {}, sessionId);
    await send("Page.navigate", { url: "file://" + sceneFile }, sessionId);
    await new Promise((res) => setTimeout(res, 2000));
    const shot = await send("Page.captureScreenshot", {
      format: "png", clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT, scale: 1 },
    }, sessionId);
    const data = Buffer.from(shot.data, "base64");
    fs.writeFileSync(outFile, data);
    done(data.length);
  } catch (e) {
    fail(e.message);
  }
}

(async () => {
  try {
    await send("Target.setDiscoverTargets", { discover: true });
    await send("Target.createTarget", { url: "about:blank" });
  } catch (e) {
    fail(e.message);
  }
})();

setTimeout(() => fail("timed out after 30s"), 30000);

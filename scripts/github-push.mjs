import { ReplitConnectors } from "@replit/connectors-sdk";
import { execSync } from "child_process";
import { readFileSync } from "fs";

const connectors = new ReplitConnectors();
const OWNER = "elijfields78";
const REPO = "pro-se-navigator";
const BRANCH = "main";
const DELAY_MS = 50;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function ghApi(path, options = {}) {
  for (let attempt = 0; attempt < 8; attempt++) {
    let res;
    try {
      res = await connectors.proxy("github", path, {
        method: options.method || "GET",
        headers: options.body ? { "Content-Type": "application/json" } : undefined,
        body: options.body ? JSON.stringify(options.body) : undefined,
      });
    } catch {
      await sleep((attempt + 1) * 1000);
      continue;
    }

    let json;
    try {
      const text = await res.text();
      if (text.trimStart().startsWith("<")) {
        const wait = (attempt + 1) * 2000;
        process.stdout.write(`  proxy HTML error, backing off ${wait / 1000}s...\r`);
        await sleep(wait);
        continue;
      }
      json = JSON.parse(text);
    } catch {
      await sleep((attempt + 1) * 1000);
      continue;
    }

    if (res.status === 429) { await sleep((attempt + 1) * 3000); continue; }
    if (options.allow404 && res.status === 404) return null;
    if (res.status >= 400) throw new Error(`GitHub ${options.method || "GET"} ${path} → ${res.status}: ${JSON.stringify(json).slice(0, 300)}`);
    return json;
  }
  throw new Error(`Failed after retries: ${path}`);
}

// ─── Step 1: Get or create the branch ───────────────────────────────────────
console.log("Checking branch state...");
let branchInfo = await ghApi(`/repos/${OWNER}/${REPO}/branches/${BRANCH}`, { allow404: true });

if (branchInfo === null) {
  // Repo is empty — initialize it via Contents API (only way to create first commit)
  console.log("Empty repo — initializing via Contents API...");
  const readmeContent = readFileSync("README.md").toString("base64");
  const initRes = await ghApi(`/repos/${OWNER}/${REPO}/contents/README.md`, {
    method: "PUT",
    body: {
      message: "chore: initialize repository",
      content: readmeContent,
      branch: BRANCH,
    },
  });
  console.log(`✓ Initialized. Seed commit: ${initRes.commit.sha.slice(0, 8)}`);
  // Re-fetch branch to get the now-existing commit/tree SHAs
  branchInfo = await ghApi(`/repos/${OWNER}/${REPO}/branches/${BRANCH}`);
}

const baseSha = branchInfo.commit.sha;
const baseTreeSha = branchInfo.commit.commit.tree.sha;
console.log(`✓ Base: ${baseSha.slice(0, 8)} | tree: ${baseTreeSha.slice(0, 8)}`);

// ─── Step 2: Collect files ───────────────────────────────────────────────────
const files = execSync(
  "git ls-files | grep -v 'pnpm-lock.yaml\\|\\.tsbuildinfo\\|\\.png\\|\\.jpg\\|\\.ico\\|\\.woff\\|\\.woff2\\|\\.ttf\\|\\.eot\\|\\.otf\\|\\.gif\\|\\.mp4\\|\\.mp3'",
  { encoding: "utf8" }
).trim().split("\n").filter(Boolean);

console.log(`\nCreating blobs for ${files.length} files (~${Math.ceil(files.length * 0.7 / 60)} min estimated)...`);
const start = Date.now();

// ─── Step 3: Blobs (sequential — connector handles this best without concurrency) ──
const treeItems = [];
for (let i = 0; i < files.length; i++) {
  const filePath = files[i];
  let content;
  try { content = readFileSync(filePath).toString("base64"); }
  catch { continue; }

  const blob = await ghApi(`/repos/${OWNER}/${REPO}/git/blobs`, {
    method: "POST",
    body: { content, encoding: "base64" },
  });
  treeItems.push({ path: filePath, mode: "100644", type: "blob", sha: blob.sha });

  const elapsed = ((Date.now() - start) / 1000).toFixed(0);
  const rate = (i + 1) / (Date.now() - start) * 1000;
  const eta = Math.ceil((files.length - i - 1) / rate);
  process.stdout.write(`  [${i + 1}/${files.length}] ${elapsed}s elapsed, ~${eta}s remaining    \r`);
  if (DELAY_MS > 0) await sleep(DELAY_MS);
}
console.log(`\n✓ ${treeItems.length} blobs in ${((Date.now() - start) / 1000).toFixed(1)}s`);

// ─── Step 4: Tree ────────────────────────────────────────────────────────────
process.stdout.write("Creating tree... ");
const tree = await ghApi(`/repos/${OWNER}/${REPO}/git/trees`, {
  method: "POST",
  body: { tree: treeItems, base_tree: baseTreeSha },
});
console.log(`✓ ${tree.sha.slice(0, 8)}`);

// ─── Step 5: Commit ──────────────────────────────────────────────────────────
process.stdout.write("Creating commit... ");
const commit = await ghApi(`/repos/${OWNER}/${REPO}/git/commits`, {
  method: "POST",
  body: {
    message: `feat: Pro Se Litigation Navigator — complete codebase

AI-powered legal command center for pro se litigants.
Stripe billing (Free/Pro/Attorney), dark premium theme,
case management, evidence center, AI assistant, legal research,
complaint generator, procedural risk engine, settlement tracker.`,
    tree: tree.sha,
    parents: [baseSha],
  },
});
console.log(`✓ ${commit.sha.slice(0, 8)}`);

// ─── Step 6: Update branch ref ───────────────────────────────────────────────
process.stdout.write(`Updating '${BRANCH}'... `);
await ghApi(`/repos/${OWNER}/${REPO}/git/refs/heads/${BRANCH}`, {
  method: "PATCH",
  body: { sha: commit.sha, force: true },
});
console.log("✓");
console.log(`\n🎉 Done! https://github.com/${OWNER}/${REPO}`);

import { ReplitConnectors } from "@replit/connectors-sdk";
import { execSync } from "child_process";
import { readFileSync } from "fs";

const connectors = new ReplitConnectors();
const OWNER = "elijfields78";
const REPO = "pro-se-navigator";
const BRANCH = "main";
const CONCURRENCY = 4;      // 4 parallel blobs at a time
const BATCH_DELAY = 800;    // ms between batches — keeps us under 10 RPS

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function ghApi(path, options = {}) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await connectors.proxy("github", path, {
      method: options.method || "GET",
      headers: options.body ? { "Content-Type": "application/json" } : undefined,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    const json = await res.json();
    if (res.status === 429) {
      const wait = (attempt + 1) * 3000;
      process.stdout.write(`  rate-limited, waiting ${wait / 1000}s...           \r`);
      await sleep(wait);
      continue;
    }
    if (res.status >= 400) {
      throw new Error(`GitHub ${path} → ${res.status}: ${JSON.stringify(json).slice(0, 300)}`);
    }
    return json;
  }
  throw new Error(`Failed after retries: ${path}`);
}

// Step 1: Get current HEAD
console.log("Getting current branch state...");
const branchInfo = await ghApi(`/repos/${OWNER}/${REPO}/branches/${BRANCH}`);
const baseSha = branchInfo.commit.sha;
const baseTreeSha = branchInfo.commit.commit.tree.sha;
console.log(`✓ Base: ${baseSha.slice(0, 8)} | tree: ${baseTreeSha.slice(0, 8)}`);

// Step 2: Collect files
const files = execSync(
  "git ls-files | grep -v 'pnpm-lock.yaml\\|\\.tsbuildinfo\\|\\.png\\|\\.jpg\\|\\.ico\\|\\.woff\\|\\.woff2\\|\\.ttf\\|\\.eot\\|\\.otf\\|\\.gif\\|\\.mp4\\|\\.mp3'",
  { encoding: "utf8" }
).trim().split("\n").filter(Boolean);
console.log(`\nCreating blobs for ${files.length} files (${CONCURRENCY} at a time)...`);

// Step 3: Blob creation in concurrent batches
async function createBlob(filePath) {
  let content;
  try { content = readFileSync(filePath).toString("base64"); }
  catch { return null; }
  const blob = await ghApi(`/repos/${OWNER}/${REPO}/git/blobs`, {
    method: "POST",
    body: { content, encoding: "base64" },
  });
  return { path: filePath, mode: "100644", type: "blob", sha: blob.sha };
}

const treeItems = [];
let done = 0;
for (let i = 0; i < files.length; i += CONCURRENCY) {
  const batch = files.slice(i, i + CONCURRENCY);
  const results = await Promise.all(batch.map(createBlob));
  results.forEach(r => { if (r) treeItems.push(r); });
  done += batch.length;
  process.stdout.write(`  ${done}/${files.length} blobs done...   \r`);
  if (i + CONCURRENCY < files.length) await sleep(BATCH_DELAY);
}
console.log(`\n✓ ${treeItems.length} blobs created`);

// Step 4: Create tree
const tree = await ghApi(`/repos/${OWNER}/${REPO}/git/trees`, {
  method: "POST",
  body: { tree: treeItems, base_tree: baseTreeSha },
});
console.log("✓ Tree:", tree.sha.slice(0, 8));

// Step 5: Create commit
const commit = await ghApi(`/repos/${OWNER}/${REPO}/git/commits`, {
  method: "POST",
  body: {
    message: "feat: Pro Se Litigation Navigator — complete codebase\n\nAI-powered legal command center for pro se litigants.\nIncludes: Stripe billing, dark premium theme, case management,\nevidence center, AI assistant, legal research, complaint generator.",
    tree: tree.sha,
    parents: [baseSha],
  },
});
console.log("✓ Commit:", commit.sha.slice(0, 8));

// Step 6: Update branch ref
await ghApi(`/repos/${OWNER}/${REPO}/git/refs/heads/${BRANCH}`, {
  method: "PATCH",
  body: { sha: commit.sha, force: true },
});
console.log(`✓ '${BRANCH}' updated`);
console.log(`\n🎉 Done! https://github.com/${OWNER}/${REPO}`);

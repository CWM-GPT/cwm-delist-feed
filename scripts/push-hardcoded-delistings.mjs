#!/usr/bin/env node

/**
 * Example updater for CWM delist feed.
 *
 * It updates docs/delistings.json through GitHub Contents API.
 * Do not hardcode GitHub tokens here. Pass token through GITHUB_TOKEN env var.
 *
 * Required token permissions for a fine-grained PAT:
 * - Repository access: CWM-GPT/cwm-delist-feed only
 * - Contents: Read and write
 * - Metadata: Read
 */

const OWNER = process.env.GITHUB_OWNER || "CWM-GPT";
const REPO = process.env.GITHUB_REPO || "cwm-delist-feed";
const BRANCH = process.env.GITHUB_BRANCH || "main";
const FILE_PATH = "docs/delistings.json";
const API_BASE = `https://api.github.com/repos/${OWNER}/${REPO}`;
const KEEP_AFTER_DELIST_MS = 24 * 60 * 60 * 1000;

const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
if (!token) {
  console.error("Missing GITHUB_TOKEN env var.");
  console.error("PowerShell example: $env:GITHUB_TOKEN='github_pat_xxx'; node scripts/push-hardcoded-delistings.mjs");
  process.exit(1);
}

// Replace this hardcoded data with the real current state.
// This is a full snapshot, not only new updates.
const HARDCODED_DELISTINGS = {
  mexc: [
    // { contract: "DAM_USDT", delistTime: "2026-04-30T07:00:00Z" },
    // { contract: "R2_USDT", delistTime: "2026-04-28T07:00:00Z" }
  ],
  gate: [
    // { contract: "BGSC_USDT", delistTime: "2027-03-20T07:30:00Z" }
  ]
};

function normalizeContract(contract) {
  return String(contract || "").trim().toUpperCase().replace(/[^A-Z0-9_]/g, "");
}

function isStillRelevant(item, now = Date.now()) {
  const time = Date.parse(item.delistTime || "");
  if (!Number.isFinite(time)) return true;
  return time >= now - KEEP_AFTER_DELIST_MS;
}

function normalizeList(list) {
  const byContract = new Map();
  for (const item of Array.isArray(list) ? list : []) {
    const contract = normalizeContract(item.contract || item.symbol || item.pair);
    if (!contract) continue;
    const normalized = {
      contract,
      delistTime: String(item.delistTime || item.time || item.date || "")
    };
    if (!isStillRelevant(normalized)) continue;
    byContract.set(contract, normalized);
  }
  return Array.from(byContract.values()).sort((a, b) => a.contract.localeCompare(b.contract));
}

function buildFeed() {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    ttlSeconds: 300,
    retentionAfterDelistHours: 24,
    delistings: {
      mexc: normalizeList(HARDCODED_DELISTINGS.mexc),
      gate: normalizeList(HARDCODED_DELISTINGS.gate)
    }
  };
}

function encodeBase64Utf8(text) {
  return Buffer.from(text, "utf8").toString("base64");
}

async function githubJson(method, url, body) {
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json"
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new Error(`GitHub API ${method} ${url} failed: ${res.status} ${text}`);
  }
  return data;
}

async function getCurrentFile() {
  const url = `${API_BASE}/contents/${encodeURIComponent(FILE_PATH).replace(/%2F/g, "/")}?ref=${encodeURIComponent(BRANCH)}`;
  return githubJson("GET", url);
}

async function updateFile(sha, content) {
  const url = `${API_BASE}/contents/${encodeURIComponent(FILE_PATH).replace(/%2F/g, "/")}`;
  return githubJson("PUT", url, {
    message: `Update delistings feed ${new Date().toISOString()}`,
    content: encodeBase64Utf8(content),
    sha,
    branch: BRANCH
  });
}

async function main() {
  const feed = buildFeed();
  const nextContent = JSON.stringify(feed, null, 2) + "\n";
  const current = await getCurrentFile();
  const currentContent = Buffer.from(current.content || "", "base64").toString("utf8");

  if (currentContent === nextContent) {
    console.log("No changes: docs/delistings.json is already up to date.");
    return;
  }

  const result = await updateFile(current.sha, nextContent);
  console.log("Updated docs/delistings.json");
  console.log(`Commit: ${result.commit?.html_url || result.commit?.sha || "unknown"}`);
  console.log("Cloudflare Pages will deploy the new JSON automatically.");
}

main().catch((err) => {
  console.error(err?.stack || err?.message || err);
  process.exit(1);
});

# CWM Delist Feed

Public static delisting feed for CWM.

## Feed URL

Cloudflare Pages feed:

```text
https://cwm-delist-feed.pages.dev/delistings.json
```

## Format

```json
{
  "version": 1,
  "updatedAt": "2026-04-29T00:00:00Z",
  "ttlSeconds": 300,
  "retentionAfterDelistHours": 24,
  "delistings": {
    "mexc": [
      { "contract": "R2_USDT", "delistTime": "2026-04-28T07:00:00Z" }
    ],
    "gate": [
      { "contract": "BGSC_USDT", "delistTime": "2027-03-20T07:30:00Z" }
    ]
  }
}
```

## Hardcoded Push Example

Example script:

```text
scripts/push-hardcoded-delistings.mjs
```

The script updates `docs/delistings.json` through GitHub Contents API. It contains a hardcoded `HARDCODED_DELISTINGS` object that can be replaced with real current data.

It also removes stale entries when:

```text
delistTime < now - 24h
```

This keeps the public JSON as a compact current snapshot, not an infinite archive.

### Token

Do not hardcode the token in the script.

Use a GitHub fine-grained personal access token with access only to this repository:

```text
CWM-GPT/cwm-delist-feed
```

Required permissions:

```text
Metadata: Read
Contents: Read and write
```

### Run From PowerShell

```powershell
$env:GITHUB_TOKEN="github_pat_xxx"
node scripts/push-hardcoded-delistings.mjs
```

### Run From Linux/macOS

```bash
GITHUB_TOKEN="github_pat_xxx" node scripts/push-hardcoded-delistings.mjs
```

After the script updates `docs/delistings.json`, Cloudflare Pages deploys the new JSON automatically.

## Safety Rules

- Do not commit secrets, tokens, private URLs, or origin server IPs.
- Keep this repository limited to public delisting data.
- Store GitHub tokens only on the updater server, never in browser/client code.
- Prefer small JSON updates and let Cloudflare Pages cache the file.

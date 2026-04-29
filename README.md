# CWM Delist Feed

Public static delisting feed for CWM.

## Feed URL

After Cloudflare Pages is connected, the feed will be available at:

```text
https://<project>.pages.dev/delistings.json
```

## Format

```json
{
  "version": 1,
  "updatedAt": "2026-04-29T00:00:00Z",
  "ttlSeconds": 300,
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

## Safety Rules

- Do not commit secrets, tokens, private URLs, or origin server IPs.
- Keep this repository limited to public delisting data.
- Prefer small JSON updates and let Cloudflare Pages cache the file.

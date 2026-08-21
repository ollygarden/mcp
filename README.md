# OllyGarden MCP server

Stateless MCP server (Streamable HTTP) on Cloudflare Workers. Auth via Clerk OAuth.

## Routes

- `ALL /mcp` – MCP endpoint (Bearer token required; 401 points clients to discovery)
- `GET /.well-known/oauth-protected-resource/mcp` – OAuth discovery → Clerk

## Dev

```bash
bun install
cp .dev.vars.example .dev.vars   # fill Clerk dev-instance keys
bun run dev                      # wrangler dev :8787 + MCP Inspector
bun run test | lint | typecheck
```

Set `CLERK_PUBLISHABLE_KEY` per env in `wrangler.toml`.

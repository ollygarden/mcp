# OllyGarden MCP server

Stateless MCP server (Streamable HTTP) on Bun + Hono. Auth via Clerk OAuth. Ships as a container for Kubernetes.

## Routes

- `ALL /mcp` – MCP endpoint (Bearer token required; 401 points clients to discovery)
- `GET /.well-known/oauth-protected-resource/mcp` – OAuth discovery → Clerk
- `GET /healthz` – liveness/readiness probe

## Config

| Env | Required | Notes |
| --- | --- | --- |
| `CLERK_PUBLISHABLE_KEY` | yes | |
| `CLERK_SECRET_KEY` | yes | mount from a Secret |
| `OLLYGARDEN_API_URL` | yes | e.g. `https://api.ollygarden.cloud/api` |
| `PUBLIC_URL` | behind ingress | public origin used in OAuth discovery metadata |
| `PORT` | no | default `8787` |

## Dev

```bash
bun install
cp .env.example .env   # fill Clerk dev-instance keys
bun run dev            # server :8787 (watch) + MCP Inspector
bun run test | lint | typecheck
```

## Container

```bash
docker build -t ollygarden-mcp .
docker run --env-file .env -p 8787:8787 ollygarden-mcp
```

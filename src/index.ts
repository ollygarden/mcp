import { clerkMiddleware } from "@clerk/hono";
import {
	mcpAuthClerk,
	protectedResourceHandlerClerk,
} from "@clerk/mcp-tools/hono";
import { createMcpHandler } from "@modelcontextprotocol/server";
import { Hono } from "hono";
import { OllyGardenClient } from "./clients/ollygarden.ts";
import { createServer } from "./server.ts";

for (const key of [
	"CLERK_PUBLISHABLE_KEY",
	"CLERK_SECRET_KEY",
	"OLLYGARDEN_API_URL",
]) {
	if (!process.env[key]) throw new Error(`${key} is required`);
}

const { OLLYGARDEN_API_URL = "", PUBLIC_URL, PORT = "8787" } = process.env;

const olly = new OllyGardenClient({ baseUrl: OLLYGARDEN_API_URL });
const mcp = createMcpHandler(() => createServer({ olly }));

const app = new Hono();

app.get("/healthz", (c) => c.text("ok"));
app.use("*", clerkMiddleware());
app.get(
	"/.well-known/oauth-protected-resource/mcp",
	protectedResourceHandlerClerk(),
);
app.all("/mcp", mcpAuthClerk, (c) =>
	mcp.fetch(c.req.raw, { authInfo: c.get("mcpAuth") }),
);

const server = Bun.serve({
	port: Number(PORT),
	// Upstream API calls can exceed Bun's 10s default.
	idleTimeout: 120,
	fetch(req) {
		// Behind an ingress the request URL is internal; OAuth discovery metadata must use the public origin.
		if (PUBLIC_URL) {
			const { pathname, search } = new URL(req.url);
			req = new Request(new URL(pathname + search, PUBLIC_URL).href, req);
		}
		return app.fetch(req);
	},
});

process.on("SIGTERM", async () => {
	await server.stop();
	process.exit(0);
});

console.log(`listening on :${server.port}`);

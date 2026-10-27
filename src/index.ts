import { clerkMiddleware } from "@clerk/hono";
import {
	authServerMetadataHandlerClerk,
	protectedResourceHandlerClerk,
} from "@clerk/mcp-tools/hono";
import { createMcpHandler } from "@modelcontextprotocol/server";
import { Hono } from "hono";
import * as z from "zod/v4";
import { mcpAuthClerkOrg, OAUTH_SCOPES } from "./auth/auth.ts";
import { OllyGardenClient } from "./clients/ollygarden.ts";
import { createServer } from "./server.ts";

const env = z
	.object({
		CLERK_PUBLISHABLE_KEY: z.string().min(1),
		CLERK_SECRET_KEY: z.string().min(1),
		OLLYGARDEN_API_URL: z.url(),
		PUBLIC_URL: z.url().optional(),
		PORT: z.coerce.number().default(8787),
	})
	.parse(process.env);

const app = new Hono();

app.get("/healthz", (c) => c.text("ok"));
app.use("*", clerkMiddleware());
app.get(
	"/.well-known/oauth-protected-resource/mcp",
	protectedResourceHandlerClerk({ scopes_supported: OAUTH_SCOPES }),
);
// Clients on MCP spec 2025-03-26 look for the authorization server metadata here instead of on Clerk.
app.get(
	"/.well-known/oauth-authorization-server",
	authServerMetadataHandlerClerk,
);
app.all("/mcp", mcpAuthClerkOrg(), (c) => {
	const olly = new OllyGardenClient({
		baseUrl: env.OLLYGARDEN_API_URL,
		token: c.get("mcpAuth").token,
	});
	return createMcpHandler(() => createServer({ olly })).fetch(c.req.raw);
});

const server = Bun.serve({
	port: env.PORT,
	idleTimeout: 120,
	fetch(req) {
		// Behind an ingress the request URL is internal; OAuth discovery metadata must use the public origin.
		if (env.PUBLIC_URL) {
			const { pathname, search } = new URL(req.url);
			req = new Request(new URL(pathname + search, env.PUBLIC_URL).href, req);
		}
		return app.fetch(req);
	},
});

process.on("SIGTERM", async () => {
	await server.stop();
	process.exit(0);
});

console.log(`listening on :${server.port}`);

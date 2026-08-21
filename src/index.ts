import { clerkMiddleware } from "@clerk/hono";
import {
	mcpAuthClerk,
	protectedResourceHandlerClerk,
} from "@clerk/mcp-tools/hono";
import { createMcpHandler } from "@modelcontextprotocol/server";
import { Hono } from "hono";
import { OllyGardenClient } from "./clients/ollygarden.ts";
import { createServer } from "./server.ts";

type Bindings = {
	CLERK_PUBLISHABLE_KEY: string;
	CLERK_SECRET_KEY: string;
	OLLYGARDEN_API_URL: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use("*", clerkMiddleware());
app.get(
	"/.well-known/oauth-protected-resource/mcp",
	protectedResourceHandlerClerk(),
);
app.all("/mcp", mcpAuthClerk, (c) => {
	const olly = new OllyGardenClient({ baseUrl: c.env.OLLYGARDEN_API_URL });
	const mcp = createMcpHandler(() => createServer({ olly }));
	return mcp.fetch(c.req.raw, { authInfo: c.get("mcpAuth") });
});

export default app;

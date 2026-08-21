import type { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import { requireAuth } from "../auth.ts";

/** Returns the authenticated caller. Useful to verify OAuth end-to-end. */
export function registerWhoami(server: McpServer) {
	server.registerTool(
		"whoami",
		{ description: "Show the authenticated user", inputSchema: z.object({}) },
		async (_args, ctx) => {
			const { userId } = requireAuth(ctx);
			return { content: [{ type: "text", text: JSON.stringify({ userId }) }] };
		},
	);
}

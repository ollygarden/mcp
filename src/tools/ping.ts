import type { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";

export function registerPing(server: McpServer) {
	server.registerTool(
		"ping",
		{
			description: "Health check",
			inputSchema: z.object({ message: z.string().optional() }),
		},
		async ({ message }) => ({
			content: [{ type: "text", text: `pong ${message ?? ""}` }],
		}),
	);
}

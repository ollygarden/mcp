import { createMcpHandler, McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";

const handler = createMcpHandler(() => {
	const server = new McpServer({ name: "ollygarden", version: "0.0.1" });
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
	return server;
});

export default handler;

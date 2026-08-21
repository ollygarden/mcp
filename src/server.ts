import { McpServer } from "@modelcontextprotocol/server";
import { registerPing } from "./tools/ping.ts";

export function createServer(): McpServer {
	const server = new McpServer({ name: "ollygarden", version: "0.0.1" });
	registerPing(server);
	return server;
}

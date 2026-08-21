import { McpServer } from "@modelcontextprotocol/server";
import pkg from "../package.json" with { type: "json" };
import type { OllyGardenClient } from "./clients/ollygarden.ts";
import { registerOrganization } from "./tools/organization.ts";
import { registerPing } from "./tools/ping.ts";
import { registerWhoami } from "./tools/whoami.ts";

export const MCP_SERVER_NAME = pkg.name;
export const MCP_SERVER_VERSION = pkg.version;

export type Deps = { olly: OllyGardenClient };

export function createServer({ olly }: Deps): McpServer {
	const server = new McpServer({
		name: MCP_SERVER_NAME,
		version: MCP_SERVER_VERSION,
	});
	registerPing(server);
	registerWhoami(server);
	registerOrganization(server, olly);
	return server;
}

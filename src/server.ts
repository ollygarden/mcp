import { McpServer } from "@modelcontextprotocol/server";
import pkg from "../package.json" with { type: "json" };
import type { OllyGardenClient } from "./clients/ollygarden.ts";
import { registerInsights } from "./tools/insights/insights.ts";
import { registerServices } from "./tools/insights/services.ts";
import { registerOrganization } from "./tools/organization.ts";
import { registerPing } from "./tools/ping.ts";
import { registerFindings } from "./tools/rose/findings.ts";
import { registerRepositories } from "./tools/rose/repositories.ts";
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
	registerInsights(server, olly);
	registerServices(server, olly);
	registerFindings(server, olly);
	registerRepositories(server, olly);
	return server;
}

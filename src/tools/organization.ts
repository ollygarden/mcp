import type { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import type { OllyGardenClient } from "../clients/ollygarden.ts";
import { jsonResult } from "../utils/result.ts";

export function registerOrganization(
	server: McpServer,
	ollygarden: OllyGardenClient,
) {
	server.registerTool(
		"get_organization",
		{
			description: "Get the caller's OllyGarden organization details",
			inputSchema: z.object({}),
			annotations: { readOnlyHint: true },
		},
		async (_args) => {
			const { data } = await ollygarden.get<unknown>("/v1/organization");
			return jsonResult(data);
		},
	);
}

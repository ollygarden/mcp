import type { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import { requireAuth } from "../auth.ts";
import type { OllyGardenClient } from "../clients/ollygarden.ts";

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
		async (_args, ctx) => {
			const { token } = requireAuth(ctx);
			const org = await ollygarden.get<unknown>("/v1/organization", token);
			return {
				content: [{ type: "text", text: JSON.stringify(org, null, 2) }],
			};
		},
	);
}

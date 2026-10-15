import type { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import { requireAuth } from "../../auth.ts";
import type { OllyGardenClient } from "../../clients/ollygarden.ts";
import { fromRose, type RosePage } from "../../utils/pagination.ts";
import { jsonResult } from "../../utils/result.ts";

export function registerRepositories(
	server: McpServer,
	ollygarden: OllyGardenClient,
) {
	server.registerTool(
		"list_repositories",
		{
			description:
				"List repositories connected to Rose, grouped by GitHub App installation",
			inputSchema: z.object({}),
			annotations: { readOnlyHint: true },
		},
		async (_args, ctx) => {
			const { token } = requireAuth(ctx);
			const { data } = await ollygarden.get<RosePage<unknown>>(
				"/v1/rose/repositories",
				token,
			);
			return jsonResult(fromRose(data));
		},
	);

	server.registerTool(
		"get_repository",
		{
			description:
				"Get one repository with activation state, instrumentation metadata, finding counts, and active findings",
			inputSchema: z.object({ id: z.uuid() }),
			annotations: { readOnlyHint: true },
		},
		async ({ id }, ctx) => {
			const { token } = requireAuth(ctx);
			const { data } = await ollygarden.get<unknown>(
				`/v1/rose/repositories/${id}`,
				token,
			);
			return jsonResult(data);
		},
	);
}

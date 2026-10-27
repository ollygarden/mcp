import type { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import type { OllyGardenClient } from "../../clients/ollygarden.ts";
import { fromOlive, pageInput } from "../../utils/pagination.ts";
import { jsonResult } from "../../utils/result.ts";

export function registerServices(
	server: McpServer,
	ollygarden: OllyGardenClient,
) {
	server.registerTool(
		"list_services",
		{
			description:
				"List monitored services with their instrumentation scores. Use a service id to filter list_insights.",
			inputSchema: z.object({ ...pageInput }),
			annotations: { readOnlyHint: true },
		},
		async (args) => {
			const { data, meta } = await ollygarden.get<unknown[]>(
				"/v1/services",
				args,
			);
			return jsonResult(fromOlive(data, args, meta));
		},
	);

	server.registerTool(
		"get_service",
		{
			description: "Get one service with its instrumentation score",
			inputSchema: z.object({ id: z.uuid() }),
			annotations: { readOnlyHint: true },
		},
		async ({ id }) => {
			const { data } = await ollygarden.get<unknown>(`/v1/services/${id}`);
			return jsonResult(data);
		},
	);
}

import type { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import type { OllyGardenClient } from "../../clients/ollygarden.ts";
import { fromOlive, pageInput } from "../../utils/pagination.ts";
import { jsonResult } from "../../utils/result.ts";

const sortFields = [
	"created_at",
	"detected_ts",
	"updated_at",
	"impact",
	"signal_type",
] as const;
const sort = z.enum(sortFields.flatMap((f) => [`+${f}`, `-${f}`]));

export function registerInsights(
	server: McpServer,
	ollygarden: OllyGardenClient,
) {
	server.registerTool(
		"list_insights",
		{
			description:
				"List telemetry quality insights across the caller's organization. Use get_insight for full details and remediation.",
			inputSchema: z.object({
				status: z.array(z.enum(["active", "archived", "muted"])).optional(),
				impact: z
					.array(z.enum(["Critical", "Important", "Normal", "Low"]))
					.optional(),
				signal_type: z.enum(["trace", "metric", "log"]).optional(),
				service_id: z.uuid().optional().describe("From list_services"),
				insight_type: z
					.array(z.string().min(1).max(128))
					.max(100)
					.optional()
					.describe("Exact insight type names"),
				date_from: z.iso
					.datetime({ offset: true })
					.optional()
					.describe("Created at or after (RFC3339)"),
				date_to: z.iso
					.datetime({ offset: true })
					.optional()
					.describe("Created at or before (RFC3339)"),
				sort: sort.optional().describe("+asc / -desc; default -created_at"),
				...pageInput,
			}),
			annotations: { readOnlyHint: true },
		},
		async (args) => {
			const { data, meta } = await ollygarden.get<unknown[]>(
				"/v1/insights",
				args,
			);
			return jsonResult(fromOlive(data, args, meta));
		},
	);

	server.registerTool(
		"get_insight",
		{
			description:
				"Get one insight with its attributes, service, and insight type including remediation instructions",
			inputSchema: z.object({ id: z.uuid() }),
			annotations: { readOnlyHint: true },
		},
		async ({ id }) => {
			const { data } = await ollygarden.get<unknown>(`/v1/insights/${id}`);
			return jsonResult(data);
		},
	);
}

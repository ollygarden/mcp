import type { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import { requireAuth } from "../../auth.ts";
import type { OllyGardenClient } from "../../clients/ollygarden.ts";
import {
	fromRose,
	pageInput,
	type RosePage,
	roseAligned,
	toRoseQuery,
} from "../../utils/pagination.ts";
import { jsonResult } from "../../utils/result.ts";

type RepositoryDetail = { findings: { finding_id: string }[] };

export function registerFindings(
	server: McpServer,
	ollygarden: OllyGardenClient,
) {
	server.registerTool(
		"list_findings",
		{
			description:
				"List active code findings across the caller's repositories. Returns headlines only; use get_finding for summary, locations, why, and fix.",
			inputSchema: z
				.object({
					severity: z
						.array(z.enum(["critical", "high", "medium", "low", "suggestion"]))
						.optional(),
					category: z
						.array(z.string().min(1))
						.optional()
						.describe('e.g. "Sensitive Data", "Volume"'),
					search: z
						.string()
						.trim()
						.min(1)
						.max(200)
						.optional()
						.describe("Case-insensitive title search"),
					dismissed: z
						.enum(["false", "true", "all"])
						.default("false")
						.describe("Include dismissed findings"),
					...pageInput,
				})
				.refine(...roseAligned),
			annotations: { readOnlyHint: true },
		},
		async ({ limit, offset, ...filters }, ctx) => {
			const { token } = requireAuth(ctx);
			const { data } = await ollygarden.get<RosePage<unknown>>(
				"/v1/rose/findings",
				token,
				{ ...filters, ...toRoseQuery({ limit, offset }) },
			);
			return jsonResult(fromRose(data));
		},
	);

	server.registerTool(
		"get_finding",
		{
			description:
				"Get one active code finding with summary, locations, why, and fix. Use repository_id and finding_id from list_findings.",
			inputSchema: z.object({
				repository_id: z.uuid(),
				finding_id: z.string().min(1),
			}),
			annotations: { readOnlyHint: true },
		},
		async ({ repository_id, finding_id }, ctx) => {
			const { token } = requireAuth(ctx);
			// No single-finding endpoint yet: the repository detail embeds full finding bodies.
			const { data } = await ollygarden.get<RepositoryDetail>(
				`/v1/rose/repositories/${repository_id}`,
				token,
			);
			const finding = data.findings.find((f) => f.finding_id === finding_id);
			if (!finding)
				throw new Error(
					`Finding ${finding_id} not found among active findings of repository ${repository_id}`,
				);
			return jsonResult(finding);
		},
	);
}

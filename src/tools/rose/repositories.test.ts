import { afterEach, describe, expect, it, vi } from "vitest";
import { callTool, requestedUrl, stubFetch } from "../../test-utils.ts";

afterEach(() => vi.unstubAllGlobals());

const id = "0b5c3f7e-8d2a-4c1e-9f3b-2a6d8e4c1b70";

describe("list_repositories", () => {
	it("normalizes the Rose page", async () => {
		const fetchMock = stubFetch({
			data: {
				data: [{ installation_id: "i1", repositories: [{ id }] }],
				pagination: { limit: 1, offset: 0, total: 1, hasMore: false },
			},
		});

		const r = await callTool("list_repositories", {});

		expect(requestedUrl(fetchMock).pathname).toBe("/api/v1/rose/repositories");
		expect(JSON.parse(r.content[0]?.text ?? "")).toEqual({
			items: [{ installation_id: "i1", repositories: [{ id }] }],
			pagination: { limit: 1, offset: 0, total: 1, has_more: false },
		});
	});
});

describe("get_repository", () => {
	it("fetches one repository and unwraps data", async () => {
		const detail = { repository: { id }, findings: [] };
		const fetchMock = stubFetch({ data: detail });

		const r = await callTool("get_repository", { id });

		expect(requestedUrl(fetchMock).pathname).toBe(
			`/api/v1/rose/repositories/${id}`,
		);
		expect(JSON.parse(r.content[0]?.text ?? "")).toEqual(detail);
	});
});

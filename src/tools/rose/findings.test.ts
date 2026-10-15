import { afterEach, describe, expect, it, vi } from "vitest";
import {
	callTool,
	requestedUrl,
	stubFetch,
	testAuth,
} from "../../test-utils.ts";

afterEach(() => vi.unstubAllGlobals());

const repoId = "0b5c3f7e-8d2a-4c1e-9f3b-2a6d8e4c1b70";

describe("list_findings", () => {
	it("maps limit/offset to Rose page/page_size and normalizes pagination", async () => {
		const fetchMock = stubFetch({
			data: {
				data: [{ finding_id: "f1", repository_id: repoId }],
				pagination: { limit: 25, offset: 50, total: 51, hasMore: false },
			},
		});

		const r = await callTool(
			"list_findings",
			{ severity: ["critical", "high"], limit: 25, offset: 50 },
			testAuth,
		);

		const url = requestedUrl(fetchMock);
		expect(url.pathname).toBe("/api/v1/rose/findings");
		expect(Object.fromEntries(url.searchParams)).toEqual({
			severity: "critical,high",
			dismissed: "false",
			page: "3",
			page_size: "25",
		});
		expect(JSON.parse(r.content[0]?.text ?? "")).toEqual({
			items: [{ finding_id: "f1", repository_id: repoId }],
			pagination: { limit: 25, offset: 50, total: 51, has_more: false },
		});
	});

	it("rejects an offset that is not a multiple of limit", async () => {
		const fetchMock = stubFetch({});
		const r = await callTool(
			"list_findings",
			{ limit: 20, offset: 5 },
			testAuth,
		);
		expect(r.isError).toBe(true);
		expect(fetchMock).not.toHaveBeenCalled();
	});
});

describe("get_finding", () => {
	const repoDetail = {
		data: {
			findings: [
				{ finding_id: "f1", why: "a" },
				{ finding_id: "f2", why: "b", fix: "c" },
			],
		},
	};

	it("returns the matching finding from the repository detail", async () => {
		const fetchMock = stubFetch(repoDetail);

		const r = await callTool(
			"get_finding",
			{ repository_id: repoId, finding_id: "f2" },
			testAuth,
		);

		const url = requestedUrl(fetchMock);
		expect(url.pathname).toBe(`/api/v1/rose/repositories/${repoId}`);
		expect(url.search).toBe("");
		expect(JSON.parse(r.content[0]?.text ?? "")).toEqual({
			finding_id: "f2",
			why: "b",
			fix: "c",
		});
	});

	it("errors when the finding is not in the repository", async () => {
		stubFetch(repoDetail);
		const r = await callTool(
			"get_finding",
			{ repository_id: repoId, finding_id: "missing" },
			testAuth,
		);
		expect(r.isError).toBe(true);
		expect(r.content[0]?.text).toMatch(/missing not found/);
	});
});

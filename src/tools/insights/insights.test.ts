import { afterEach, describe, expect, it, vi } from "vitest";
import { callTool, requestedUrl, stubFetch } from "../../test-utils.ts";

afterEach(() => vi.unstubAllGlobals());

const id = "0b5c3f7e-8d2a-4c1e-9f3b-2a6d8e4c1b70";

describe("list_insights", () => {
	it("joins filters, forwards paging, and normalizes pagination", async () => {
		const fetchMock = stubFetch({
			data: [{ id }],
			meta: { total: 42, has_more: true },
		});

		const r = await callTool("list_insights", {
			status: ["active", "muted"],
			impact: ["Critical"],
			sort: "-impact",
			limit: 10,
			offset: 20,
		});

		const url = requestedUrl(fetchMock);
		expect(url.pathname).toBe("/api/v1/insights");
		expect(Object.fromEntries(url.searchParams)).toEqual({
			status: "active,muted",
			impact: "Critical",
			sort: "-impact",
			limit: "10",
			offset: "20",
		});
		expect(JSON.parse(r.content[0]?.text ?? "")).toEqual({
			items: [{ id }],
			pagination: { limit: 10, offset: 20, total: 42, has_more: true },
		});
	});
});

describe("get_insight", () => {
	it("fetches one insight and unwraps data", async () => {
		const fetchMock = stubFetch({ data: { id, impact: "Critical" } });

		const r = await callTool("get_insight", { id });

		expect(requestedUrl(fetchMock).pathname).toBe(`/api/v1/insights/${id}`);
		expect(JSON.parse(r.content[0]?.text ?? "")).toEqual({
			id,
			impact: "Critical",
		});
	});

	it("rejects a non-UUID id without calling the API", async () => {
		const fetchMock = stubFetch({});
		const r = await callTool("get_insight", { id: "nope" });
		expect(r.isError).toBe(true);
		expect(fetchMock).not.toHaveBeenCalled();
	});
});

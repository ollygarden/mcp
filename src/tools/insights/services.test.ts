import { afterEach, describe, expect, it, vi } from "vitest";
import {
	callTool,
	requestedUrl,
	stubFetch,
	testAuth,
} from "../../test-utils.ts";

afterEach(() => vi.unstubAllGlobals());

const id = "0b5c3f7e-8d2a-4c1e-9f3b-2a6d8e4c1b70";

describe("list_services", () => {
	it("forwards paging and normalizes pagination", async () => {
		const fetchMock = stubFetch({
			data: [{ id }],
			meta: { total: 1, has_more: false },
		});

		const r = await callTool("list_services", { limit: 5 }, testAuth);

		const url = requestedUrl(fetchMock);
		expect(url.pathname).toBe("/api/v1/services");
		expect(Object.fromEntries(url.searchParams)).toEqual({
			limit: "5",
			offset: "0",
		});
		expect(JSON.parse(r.content[0]?.text ?? "")).toEqual({
			items: [{ id }],
			pagination: { limit: 5, offset: 0, total: 1, has_more: false },
		});
	});
});

describe("get_service", () => {
	it("fetches one service and unwraps data", async () => {
		const fetchMock = stubFetch({ data: { id, name: "checkout" } });

		const r = await callTool("get_service", { id }, testAuth);

		expect(requestedUrl(fetchMock).pathname).toBe(`/api/v1/services/${id}`);
		expect(JSON.parse(r.content[0]?.text ?? "")).toEqual({
			id,
			name: "checkout",
		});
	});
});

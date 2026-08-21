import { afterEach, describe, expect, it, vi } from "vitest";
import { callTool, testAuth } from "../test-utils.ts";

afterEach(() => vi.unstubAllGlobals());

describe("get_organization", () => {
	it("calls /v1/organization with the caller token and unwraps data", async () => {
		const fetchMock = vi.fn(async () =>
			Response.json({ data: { tier: "free", score: null } }),
		);
		vi.stubGlobal("fetch", fetchMock);

		const r = await callTool("get_organization", {}, testAuth);

		const [url, init] = fetchMock.mock.calls[0] as unknown as [
			URL,
			RequestInit,
		];
		expect(String(url)).toBe("https://api.test/api/v1/organization");
		expect(new Headers(init.headers).get("authorization")).toBe(
			"Bearer test-token",
		);
		expect(JSON.parse(r.content[0]?.text ?? "")).toEqual({
			tier: "free",
			score: null,
		});
	});

	it("surfaces API errors", async () => {
		vi.stubGlobal(
			"fetch",
			async () =>
				new Response("nope", { status: 401, statusText: "Unauthorized" }),
		);
		const r = await callTool("get_organization", {}, testAuth);
		expect(r.isError).toBe(true);
		expect(r.content[0]?.text).toMatch(/401/);
	});
});

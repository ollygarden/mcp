import { describe, expect, it } from "vitest";
import { callTool, testAuth } from "../test-utils.ts";

describe("whoami", () => {
	it("returns userId when authenticated", async () => {
		const r = await callTool("whoami", {}, testAuth);
		expect(JSON.parse(r.content[0]?.text ?? "")).toEqual({
			userId: "user_123",
		});
	});

	it("errors when unauthenticated", async () => {
		const r = await callTool("whoami", {});
		expect(r.isError).toBe(true);
		expect(r.content[0]?.text).toMatch(/Unauthenticated/);
	});
});

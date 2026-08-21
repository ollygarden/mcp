import { describe, expect, it } from "vitest";
import { callTool } from "../test-utils.ts";

describe("ping", () => {
	it("responds", async () => {
		const r = await callTool("ping", { message: "hi" });
		expect(r.content[0]?.text).toBe("pong hi");
	});
});

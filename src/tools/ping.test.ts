import { describe, expect, it } from "vitest";
import handler from "../index.ts";

describe("ping", () => {
	it("responds", async () => {
		const res = await handler.fetch(
			new Request("http://localhost/mcp", {
				method: "POST",
				headers: {
					"content-type": "application/json",
					accept: "application/json, text/event-stream",
				},
				body: JSON.stringify({
					jsonrpc: "2.0",
					id: 1,
					method: "tools/call",
					params: { name: "ping", arguments: { message: "hi" } },
				}),
			}),
		);
		const text = await res.text();
		const data = text.split("\n").find((l) => l.startsWith("data: "));
		expect(res.status).toBe(200);
		expect(JSON.parse(data?.slice(6) ?? "{}").result.content[0].text).toBe(
			"pong hi",
		);
	});
});

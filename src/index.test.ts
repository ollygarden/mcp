import { describe, expect, it } from "vitest";
import handler from "./index.ts";

async function call(body: unknown) {
	const res = await handler.fetch(
		new Request("http://localhost/mcp", {
			method: "POST",
			headers: {
				"content-type": "application/json",
				accept: "application/json, text/event-stream",
			},
			body: JSON.stringify(body),
		}),
	);
	const text = await res.text();
	const data = text.split("\n").find((l) => l.startsWith("data: "));
	return {
		status: res.status,
		json: data ? JSON.parse(data.slice(6)) : JSON.parse(text),
	};
}

describe("mcp", () => {
	it("ping tool responds", async () => {
		const { status, json } = await call({
			jsonrpc: "2.0",
			id: 1,
			method: "tools/call",
			params: { name: "ping", arguments: { message: "hi" } },
		});
		expect(status).toBe(200);
		expect(json.result.content[0].text).toBe("pong hi");
	});
});

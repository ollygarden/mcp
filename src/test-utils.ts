import { createMcpHandler } from "@modelcontextprotocol/server";
import { vi } from "vitest";
import { OllyGardenClient } from "./clients/ollygarden.ts";
import { createServer } from "./server.ts";

export const olly = new OllyGardenClient({
	baseUrl: "https://api.test/api",
	token: "test-token",
});

/** In-process MCP tool call against the handler. Stub `globalThis.fetch` to fake the OllyGarden API. */
export async function callTool(name: string, args: Record<string, unknown>) {
	const handler = createMcpHandler(() => createServer({ olly }));
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
				params: { name, arguments: args },
			}),
		}),
	);
	const text = await res.text();
	const data = text.split("\n").find((l) => l.startsWith("data: "));
	return JSON.parse(data?.slice(6) ?? "{}").result as {
		isError?: boolean;
		content: { type: string; text: string }[];
	};
}

/** Stubs `fetch` to answer every request with `body` as JSON; returns the mock. */
export function stubFetch(body: unknown) {
	const mock = vi.fn(async (_url: URL, _init?: RequestInit) =>
		Response.json(body),
	);
	vi.stubGlobal("fetch", mock);
	return mock;
}

/** URL of the n-th request made through a `stubFetch` mock. */
export const requestedUrl = (mock: ReturnType<typeof stubFetch>, n = 0) =>
	new URL(String(mock.mock.calls[n]?.[0]));

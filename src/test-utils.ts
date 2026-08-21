import { createMcpHandler } from "@modelcontextprotocol/server";
import { OllyGardenClient } from "./clients/ollygarden.ts";
import { createServer } from "./server.ts";

export type AuthInfo = {
	token: string;
	clientId: string;
	scopes: string[];
	extra?: Record<string, unknown>;
};

export const testAuth: AuthInfo = {
	token: "test-token",
	clientId: "test-client",
	scopes: [],
	extra: { userId: "user_123" },
};

export const olly = new OllyGardenClient({ baseUrl: "https://api.test/api" });

/** In-process MCP tool call against the handler. Stub `globalThis.fetch` to fake the OllyGarden API. */
export async function callTool(
	name: string,
	args: Record<string, unknown>,
	authInfo?: AuthInfo,
) {
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
		{ authInfo },
	);
	const text = await res.text();
	const data = text.split("\n").find((l) => l.startsWith("data: "));
	return JSON.parse(data?.slice(6) ?? "{}").result as {
		isError?: boolean;
		content: { type: string; text: string }[];
	};
}

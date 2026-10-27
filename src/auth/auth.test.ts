import { Hono } from "hono";
import { describe, expect, it, vi } from "vitest";
import { mcpAuthClerkOrg } from "./auth.ts";

/** Scopes of the fake verified Clerk OAuth token. */
let grantedScopes: string[] = [];
vi.mock("@clerk/hono", () => ({
	getAuth: () => ({
		isAuthenticated: true,
		tokenType: "oauth_token",
		clientId: "test-client",
		userId: "user_123",
		scopes: grantedScopes,
	}),
}));

/** Unsigned JWT access token; signature checks belong to the mocked Clerk verification. */
function jwt(claims: Record<string, unknown>) {
	const encode = (part: object) =>
		Buffer.from(JSON.stringify(part)).toString("base64url");
	return `${encode({ alg: "RS256", typ: "at+jwt" })}.${encode(claims)}.signature`;
}

/** Runs the middleware for `token` granted `scopes`. */
function requestWith(token: string, scopes: string[]) {
	grantedScopes = scopes;
	const app = new Hono();
	app.get("/mcp", mcpAuthClerkOrg(), (c) => c.text("ok"));
	return app.request("/mcp", {
		headers: { authorization: `Bearer ${token}` },
	});
}

async function expectInsufficientScope(response: Response) {
	expect(response.status).toBe(403);
	expect(response.headers.get("www-authenticate")).toBe(
		'Bearer error="insufficient_scope", scope="openid user:org:read"',
	);
	expect(await response.json()).toEqual({
		error: expect.stringContaining("select an organization"),
	});
}

describe("mcpAuthClerkOrg", () => {
	it("accepts a token with a consent organization", async () => {
		const token = jwt({ sub: "user_123", org_id: "org_selected" });
		const response = await requestWith(token, ["openid", "user:org:read"]);
		expect(response.status).toBe(200);
	});

	it("rejects a token without the organization scope", async () => {
		const token = jwt({ sub: "user_123", org_id: "org_selected" });
		await expectInsufficientScope(await requestWith(token, ["openid"]));
	});

	it.each([
		{ sub: "user_123" },
		{ sub: "user_123", org_id: null },
		{ sub: "user_123", org_id: "" },
	])("rejects a token with %j", async (claims) => {
		const token = jwt(claims);
		await expectInsufficientScope(await requestWith(token, ["user:org:read"]));
	});

	it("rejects an opaque token", async () => {
		await expectInsufficientScope(
			await requestWith("oat_opaque", ["user:org:read"]),
		);
	});
});

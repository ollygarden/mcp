import { Hono } from "hono";
import { afterEach, describe, expect, it, vi } from "vitest";
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

const userInfoUrl = "https://clerk.example.com/oauth/userinfo";
const publishableKey = `pk_test_${btoa("clerk.example.com$")}`;

/** Runs the middleware for a token with `scopes`. */
function requestWith(scopes: string[]) {
	grantedScopes = scopes;
	const app = new Hono();
	app.get("/mcp", mcpAuthClerkOrg(publishableKey), (c) => c.text("ok"));
	return app.request("/mcp", {
		headers: { authorization: "Bearer test-token" },
	});
}

function stubUserInfo(response: Response) {
	const mock = vi.fn(async (_url: string, _init?: RequestInit) => response);
	vi.stubGlobal("fetch", mock);
	return mock;
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

afterEach(() => vi.unstubAllGlobals());

describe("mcpAuthClerkOrg", () => {
	it("accepts a token with a consent organization", async () => {
		const mock = stubUserInfo(Response.json({ org_id: "org_selected" }));
		const response = await requestWith(["openid", "user:org:read"]);
		expect(response.status).toBe(200);
		expect(mock).toHaveBeenCalledWith(
			userInfoUrl,
			expect.objectContaining({
				headers: { authorization: "Bearer test-token" },
			}),
		);
	});

	it("rejects a token without the organization scope", async () => {
		const mock = stubUserInfo(Response.json({ org_id: "org_selected" }));
		await expectInsufficientScope(await requestWith(["openid"]));
		expect(mock).not.toHaveBeenCalled();
	});

	it.each([
		undefined,
		null,
		"",
	])("rejects a token when org_id is %j", async (org_id) => {
		stubUserInfo(Response.json({ org_id }));
		await expectInsufficientScope(await requestWith(["user:org:read"]));
	});

	it("fails on Clerk errors without leaking the response body", async () => {
		stubUserInfo(new Response("secret-upstream-body", { status: 500 }));
		const response = await requestWith(["user:org:read"]);
		expect(response.status).toBe(500);
		expect(await response.text()).not.toContain("secret-upstream-body");
	});
});

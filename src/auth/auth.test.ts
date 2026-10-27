import { Hono } from "hono";
import { exportJWK, generateKeyPair, type JWTPayload, SignJWT } from "jose";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { mcpAuthClerkOrg } from "./auth.ts";

const issuer = "https://clerk.example.com";
const publishableKey = `pk_test_${btoa("clerk.example.com$")}`;

let clerkKey: CryptoKey;
let otherKey: CryptoKey;

beforeAll(async () => {
	const clerk = await generateKeyPair("RS256");
	clerkKey = clerk.privateKey;
	otherKey = (await generateKeyPair("RS256")).privateKey;
	const jwk = await exportJWK(clerk.publicKey);
	jwk.kid = "k1";
	const jwks = { keys: [jwk] };
	vi.stubGlobal(
		"fetch",
		vi.fn(async (url: URL | string) =>
			String(url) === `${issuer}/.well-known/jwks.json`
				? Response.json(jwks)
				: new Response("not found", { status: 404 }),
		),
	);
});

afterEach(() => vi.clearAllMocks());

const validClaims: JWTPayload = {
	sub: "user_123",
	client_id: "client_123",
	scope: "openid user:org:read",
	org_id: "org_selected",
};

/** Signs a Clerk-shaped OAuth access token; options override one property at a time. */
function sign(
	claims: JWTPayload,
	{ key = clerkKey, typ = "at+jwt", iss = issuer, exp = "5m" } = {},
) {
	return new SignJWT(claims)
		.setProtectedHeader({ alg: "RS256", typ, kid: "k1" })
		.setIssuer(iss)
		.setIssuedAt()
		.setExpirationTime(exp)
		.sign(key);
}

/** Runs the middleware for `token`. */
function requestWith(token: string) {
	const app = new Hono();
	app.get("/mcp", mcpAuthClerkOrg(publishableKey), (c) => c.text("ok"));
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
	it("accepts a Clerk access token with a consent organization", async () => {
		const response = await requestWith(await sign(validClaims));
		expect(response.status).toBe(200);
	});

	it("rejects a token without the organization scope", async () => {
		const token = await sign({
			sub: "user_123",
			client_id: "client_123",
			scope: "openid",
			org_id: "org_selected",
		});
		await expectInsufficientScope(await requestWith(token));
	});

	it.each([
		{ sub: "user_123", client_id: "client_123", scope: "user:org:read" },
		{
			sub: "user_123",
			client_id: "client_123",
			scope: "user:org:read",
			org_id: null,
		},
		{
			sub: "user_123",
			client_id: "client_123",
			scope: "user:org:read",
			org_id: "",
		},
	])("rejects a token without an organization: %j", async (claims) => {
		await expectInsufficientScope(await requestWith(await sign(claims)));
	});

	it.each([
		[
			"a session token",
			() =>
				sign({
					sub: "user_123",
					client_id: "client_123",
					scope: "openid user:org:read",
					org_id: "org_selected",
					sid: "sess_123",
				}),
		],
		["another token type", () => sign(validClaims, { typ: "JWT" })],
		["another issuer", () => sign(validClaims, { iss: "https://evil.com" })],
		["an expired token", () => sign(validClaims, { exp: "-5m" })],
		["another signing key", () => sign(validClaims, { key: otherKey })],
		["an opaque token", async () => "oat_opaque"],
	])("rejects %s", async (_name, token) => {
		const response = await requestWith(await token());
		expect(response.status).toBe(401);
	});
});

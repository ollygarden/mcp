import { mcpAuth } from "@clerk/mcp-tools/hono";
import { generateClerkProtectedResourceMetadata } from "@clerk/mcp-tools/server";
import type { MiddlewareHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import { createRemoteJWKSet, jwtVerify } from "jose";
import * as z from "zod/v4";

export const ORGANIZATION_SCOPE = "user:org:read";
export const OAUTH_SCOPES = ["openid", ORGANIZATION_SCOPE];
export const ORGANIZATION_REQUIRED =
	"Organization context required. Reconnect with the user:org:read scope and select an organization on Clerk's consent screen.";

const claimsSchema = z.object({
	sub: z.string().min(1),
	client_id: z.string(),
	scope: z.string().default(""),
	org_id: z.string().nullish(),
});

/** Verifies Clerk OAuth access tokens locally against the instance's public JWKS. */
export function mcpAuthClerkOrg(publishableKey: string): MiddlewareHandler {
	const [issuer = ""] = generateClerkProtectedResourceMetadata({
		publishableKey,
		resourceUrl: "",
	}).authorization_servers;
	const jwks = createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`));

	return mcpAuth(async (token) => {
		const verified = await jwtVerify(token, jwks, {
			issuer,
			typ: "at+jwt",
			algorithms: ["RS256"],
			clockTolerance: 60,
		}).catch(() => undefined);
		// A session token is also Clerk-signed; only `sid` tells it apart.
		if (!verified || verified.payload.sid) return;

		const claims = claimsSchema.parse(verified.payload);
		const scopes = claims.scope.split(" ");
		if (scopes.includes(ORGANIZATION_SCOPE) && claims.org_id) {
			return {
				token,
				clientId: claims.client_id,
				scopes,
				extra: { userId: claims.sub },
			};
		}

		throw new HTTPException(403, {
			res: Response.json(
				{ error: ORGANIZATION_REQUIRED },
				{
					status: 403,
					headers: {
						"WWW-Authenticate": `Bearer error="insufficient_scope", scope="${OAUTH_SCOPES.join(" ")}"`,
					},
				},
			),
		});
	});
}

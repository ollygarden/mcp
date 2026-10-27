import { getAuth } from "@clerk/hono";
import { mcpAuth } from "@clerk/mcp-tools/hono";
import { verifyClerkToken } from "@clerk/mcp-tools/server";
import type { MiddlewareHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import * as z from "zod/v4";

export const ORGANIZATION_SCOPE = "user:org:read";
export const OAUTH_SCOPES = ["openid", ORGANIZATION_SCOPE];
export const ORGANIZATION_REQUIRED =
	"Organization context required. Reconnect with the user:org:read scope and select an organization on Clerk's consent screen.";

const claimsSchema = z.object({ org_id: z.string().nullish() });

/** Organization selected at OAuth consent. Only JWT access tokens carry it; Clerk has already verified the token. */
function consentOrgId(token: string) {
	const [, payload] = token.split(".");
	if (!payload) return;
	const claims = JSON.parse(Buffer.from(payload, "base64url").toString());
	return claimsSchema.parse(claims).org_id;
}

/** mcpAuthClerk that also requires the token's consent organization. */
export function mcpAuthClerkOrg(): MiddlewareHandler {
	return mcpAuth(async (token, c) => {
		const auth = verifyClerkToken(
			getAuth(c, { acceptsToken: "oauth_token" }),
			token,
		);
		if (!auth) return;
		if (auth.scopes.includes(ORGANIZATION_SCOPE) && consentOrgId(token)) {
			return auth;
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

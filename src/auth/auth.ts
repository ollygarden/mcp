import { getAuth } from "@clerk/hono";
import { mcpAuth } from "@clerk/mcp-tools/hono";
import {
	generateClerkProtectedResourceMetadata,
	verifyClerkToken,
} from "@clerk/mcp-tools/server";
import type { MiddlewareHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import * as z from "zod/v4";

export const ORGANIZATION_SCOPE = "user:org:read";
export const OAUTH_SCOPES = ["openid", ORGANIZATION_SCOPE];
export const ORGANIZATION_REQUIRED =
	"Organization context required. Reconnect with the user:org:read scope and select an organization on Clerk's consent screen.";

const userInfoSchema = z.object({ org_id: z.string().nullish() });

/** mcpAuthClerk that also requires an organization selected at OAuth consent, checked via Clerk user-info. */
export function mcpAuthClerkOrg(publishableKey: string): MiddlewareHandler {
	const { authorization_servers } = generateClerkProtectedResourceMetadata({
		publishableKey,
		resourceUrl: "",
	});
	const userInfoUrl = `${authorization_servers[0]}/oauth/userinfo`;

	return mcpAuth(async (token, c) => {
		const auth = verifyClerkToken(
			getAuth(c, { acceptsToken: "oauth_token" }),
			token,
		);
		if (!auth) return;

		if (auth.scopes.includes(ORGANIZATION_SCOPE)) {
			const response = await fetch(userInfoUrl, {
				headers: { authorization: `Bearer ${token}` },
				signal: AbortSignal.timeout(5_000),
			});
			if (!response.ok) throw new Error(`Clerk user-info: ${response.status}`);

			const { org_id } = userInfoSchema.parse(await response.json());
			if (org_id) return auth;
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

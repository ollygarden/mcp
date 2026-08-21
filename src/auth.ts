import type { ServerContext } from "@modelcontextprotocol/server";

export type Caller = { userId: string; token: string };

export function requireAuth(ctx: ServerContext): Caller {
	const auth = ctx.http?.authInfo;
	const userId = auth?.extra?.userId;
	if (!auth || typeof userId !== "string") throw new Error("Unauthenticated");
	return { userId, token: auth.token };
}

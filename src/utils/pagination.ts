import * as z from "zod/v4";
import type { ApiMeta } from "../clients/ollygarden.ts";

/** Uniform paging inputs for every `list_*` tool. */
export const pageInput = {
	limit: z.number().int().min(1).max(100).default(20),
	offset: z.number().int().min(0).default(0),
};

export type PageArgs = { limit: number; offset: number };

/** Uniform output of every `list_*` tool. */
export type Page<T> = {
	items: T[];
	pagination: PageArgs & { total?: number; has_more?: boolean };
};

/** Olive-native lists: paging echoes the request, totals come from `meta`. */
export function fromOlive<T>(
	items: T[],
	{ limit, offset }: PageArgs,
	meta?: ApiMeta,
): Page<T> {
	return {
		items,
		pagination: { limit, offset, total: meta?.total, has_more: meta?.has_more },
	};
}

/** Rose list body, passed through inside Olive's `data`. */
export type RosePage<T> = {
	data: T[];
	pagination: PageArgs & { total: number; hasMore: boolean };
};

export function fromRose<T>({ data, pagination: p }: RosePage<T>): Page<T> {
	return {
		items: data,
		pagination: {
			limit: p.limit,
			offset: p.offset,
			total: p.total,
			has_more: p.hasMore,
		},
	};
}

/** Rose pages by number: maps `limit`/`offset` to `page`/`page_size`. */
export const toRoseQuery = ({ limit, offset }: PageArgs) => ({
	page: offset / limit + 1,
	page_size: limit,
});

/** Schema refinement for Rose-backed lists: `offset` must land on a page boundary. */
export const roseAligned: [
	(a: PageArgs) => boolean,
	{ message: string; path: string[] },
] = [
	(a) => a.offset % a.limit === 0,
	{ message: "offset must be a multiple of limit", path: ["offset"] },
];

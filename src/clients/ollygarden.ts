export type OgClientOptions = {
	baseUrl: string;
	token: string;
};

export type ApiMeta = { total?: number; has_more?: boolean };
export type ApiResponse<T> = { data: T; links?: unknown; meta?: ApiMeta };

/** Minimal client for the OllyGarden REST API (https://api.ollygarden.cloud/openapi.json). */
export class OllyGardenClient {
	private readonly baseUrl: string;
	private readonly token: string;

	constructor({ baseUrl, token }: OgClientOptions) {
		this.baseUrl = baseUrl.replace(/\/$/, "");
		this.token = token;
	}

	/**
	 * GET {baseUrl}{path} with the caller's bearer token; returns the response envelope.
	 * Array query values are sent comma-separated; empty arrays are omitted.
	 */
	async get<T>(
		path: string,
		query?: Record<string, string | number | boolean | string[] | undefined>,
	): Promise<ApiResponse<T>> {
		const url = new URL(`${this.baseUrl}${path}`);
		for (const [k, v] of Object.entries(query ?? {})) {
			if (v === undefined || (Array.isArray(v) && !v.length)) continue;
			url.searchParams.set(k, Array.isArray(v) ? v.join(",") : String(v));
		}
		const res = await fetch(url, {
			headers: {
				authorization: `Bearer ${this.token}`,
				accept: "application/json",
			},
		});
		if (!res.ok)
			throw new Error(
				`OllyGarden API ${res.status} ${res.statusText}: GET ${path}${await errorDetail(res)}`,
			);
		return (await res.json()) as ApiResponse<T>;
	}
}

/** Extracts `error.message` from an OllyGarden error body, if present. */
async function errorDetail(res: Response): Promise<string> {
	try {
		const body = (await res.json()) as { error?: { message?: string } };
		return body.error?.message ? ` – ${body.error.message}` : "";
	} catch {
		return "";
	}
}

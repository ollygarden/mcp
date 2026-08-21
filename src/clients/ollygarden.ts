export type OgClientOptions = {
	baseUrl: string;
};

type ApiResponse<T> = { data: T; links?: unknown; meta?: unknown };

/** Minimal client for the OllyGarden REST API (https://api.ollygarden.cloud/openapi.json). */
export class OllyGardenClient {
	private readonly baseUrl: string;

	constructor({ baseUrl }: OgClientOptions) {
		this.baseUrl = baseUrl.replace(/\/$/, "");
	}

	/** GET {baseUrl}{path} with the caller's bearer token; returns the unwrapped `data`. */
	async get<T>(
		path: string,
		token: string,
		query?: Record<string, string | number | boolean | undefined>,
	): Promise<T> {
		const url = new URL(`${this.baseUrl}${path}`);
		for (const [k, v] of Object.entries(query ?? {}))
			if (v !== undefined) url.searchParams.set(k, String(v));
		const res = await fetch(url, {
			headers: { authorization: `Bearer ${token}`, accept: "application/json" },
		});
		if (!res.ok)
			throw new Error(
				`OllyGarden API ${res.status} ${res.statusText}: GET ${path}`,
			);
		const body = (await res.json()) as ApiResponse<T>;
		return body.data;
	}
}

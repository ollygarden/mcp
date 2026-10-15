/** Wraps a value as a JSON text tool result. */
export function jsonResult(value: unknown) {
	return {
		content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }],
	};
}

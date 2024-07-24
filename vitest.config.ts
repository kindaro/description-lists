import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		coverage: {
			enabled: false,
			provider: "istanbul",
			include: ["source"],
		},
		browser: {
			enabled: true,
			provider: "playwright",
			name: "firefox",
			headless: true,
		},
	},
});

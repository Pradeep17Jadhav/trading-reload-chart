import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig(({ mode }) => {
	const isLibraryBuild = mode === "library";

	if (isLibraryBuild) {
		return {
			plugins: [
				react(),
				dts({
					entryRoot: "src",
					tsconfigPath: "./tsconfig.json",
				}),
			],
			build: {
				lib: {
					entry: resolve(__dirname, "src/index.ts"),
					name: "TradingReloadChart",
					formats: ["es"],
					fileName: "trading-reload-chart",
				},
				rollupOptions: {
					external: ["react", "react-dom", "react/jsx-runtime"],
				},
				sourcemap: true,
				minify: "esbuild",
			},
		};
	}

	return {
		plugins: [react()],
		server: {
			port: 8999,
		},
	};
});

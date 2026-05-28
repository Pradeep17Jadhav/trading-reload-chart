import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig(({ mode }) => {
	const isLibraryBuild = mode === "library";

	if (isLibraryBuild) {
		return {
			plugins: [
				react(),
				dts({
					entryRoot: "src",
					include: ["src"],
					tsconfigPath: "./tsconfig.json",
					beforeWriteFile: (filePath, content) => {
						const normalizedPath = filePath.replaceAll("\\", "/");
						const distSrcPrefix = `${resolve(__dirname, "dist", "src").replaceAll("\\", "/")}/`;

						if (!normalizedPath.startsWith(distSrcPrefix)) {
							return {
								filePath,
								content,
							};
						}

						return {
							filePath: normalizedPath.replace(distSrcPrefix, `${resolve(__dirname, "dist").replaceAll("\\", "/")}/`),
							content,
						};
					},
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
				sourcemap: false,
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

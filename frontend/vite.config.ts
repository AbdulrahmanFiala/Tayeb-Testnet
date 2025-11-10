import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
	base: process.env.VITE_GITHUB_PAGES ? "/Tayeb/" : "/",
	plugins: [react()],
});

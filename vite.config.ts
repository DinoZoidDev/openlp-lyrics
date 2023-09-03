import preact from "@preact/preset-vite";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [preact()],
    base: "",
    build: {
        rollupOptions: {
            input: {
                stage: "./stage.html",
                control: "./control.html",
            },
            // output: {
            //     assetFileNames: "[name]-[hash][extname]",
            //     chunkFileNames: "libs/[name]-[hash].js",
            //     entryFileNames: "libs/[name]-[hash].js",
            // },
        },
    },
});

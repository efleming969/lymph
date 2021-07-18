import { nodeResolve } from "@rollup/plugin-node-resolve"
import typescript from "@rollup/plugin-typescript"

export default {
    input: "./src/index.ts",
    output: [
        {
            file: "./dist/index.module.js",
            format: "es",
            sourcemap: true
        },
        {
            file: "./dist/index.js",
            format: "cjs",
            sourcemap: true
        }
    ],
    plugins: [ nodeResolve(), typescript( { module: "es2020" } ) ]
}
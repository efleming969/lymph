module.exports = function() {
    return {
        files: [ "package.json", "src/**/*.ts", "!src/**/*Tests.ts" ],
        tests: [ "src/**/*Tests.ts" ],
        env: { type: "node" },
        testFramework: "mocha",
        workers: { restart: true }
    }
}
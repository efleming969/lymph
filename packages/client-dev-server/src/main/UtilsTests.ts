import { deepStrictEqual } from "assert"
import { transformBareImports, transformRelativeImports } from "./Utils.js"

describe( "transform imports", () => {

    it( "should handle simple imports", () => {
        const s = `
           import bar from "bar"
           import foo from "foo"
           import foo2 from "foo2";
           import foo3 from "foo3"
           import {
            one, two
           } from "things"
        `

        const results = transformBareImports( s, ( moduleName ) => `./mods/${ moduleName }` )

        deepStrictEqual( results, `
           import bar from "./mods/bar"
           import foo from "./mods/foo"
           import foo2 from "./mods/foo2";
           import foo3 from "./mods/foo3"
           import {
            one, two
           } from "./mods/things"
        ` )
    } )

    it( "relative imports", () => {
        const s = `
            import bar from "./bar.js"
        `

        const results = transformBareImports( s, ( moduleName ) => `./mods/${ moduleName }` )

        deepStrictEqual( results, `
            import bar from "./bar.js"
        ` )
    } )

    it( "typescript type imports", () => {
        const s = `
            import type {a, b} from "some-types"
        `

        const results = transformBareImports( s, ( moduleName ) => `./mods/${ moduleName }` )

        deepStrictEqual( results, `
            import type {a, b} from "some-types"
        ` )
    } )

    it( "namespaced imports", () => {
        const s = `
            import { Runner, suites } from "@acme/test"
        `
        const results = transformBareImports( s, ( moduleName ) => `./mods/${ moduleName }` )

        deepStrictEqual( results, `
            import { Runner, suites } from "./mods/@acme/test"
        ` )
    } )

    it( "index exports", () => {
        const s = `
            export { default as Button } from "./Button"
        `
        const results = transformRelativeImports( s )

        deepStrictEqual( results, `
            export { default as Button } from "./Button.js"
        ` )
    } )

    it( "relative imports", () => {
        const s = `
            import Button from "./Button"
        `
        const results = transformRelativeImports( s )

        deepStrictEqual( results, `
            import Button from "./Button.js"
        ` )
    } )

    it( "relative imports higher than one parent", () => {
        const s = `
            import Location from "../../../Thing"
        `
        const results = transformRelativeImports( s )

        deepStrictEqual( results, `
            import Location from "../../../Thing.js"
        ` )
    } )
} )
import * as assert from "assert"
import DifferenceBuilder from "./DifferenceBuilder"

describe( "difference", () => {
    let diffs

    it( "summary of diffs", () => {
        diffs = DifferenceBuilder.getDiffs( {}, {} )
        assert.deepStrictEqual( diffs.hasDiffs, false )
    } )

    describe( "objects", () => {

        beforeEach( () => {
            const a = {
                field1: "foo",
                field3: "foo"
            }

            const b = {
                field1: "bar",
                field2: "bar"
            }

            diffs = DifferenceBuilder.getDiffs( a, b )
        } )

        it( "supports edited values", () => {
            assert.deepStrictEqual( diffs.edited[ 0 ], { field1: { newValue: "bar", oldValue: "foo" } } )
        } )

        it( "supports new values", () => {
            assert.deepStrictEqual( diffs.new, { field2: "bar" } )
        } )

        it( "supports removed values", () => {
            assert.deepStrictEqual( diffs.removed, { field3: "foo" } )
        } )
    } )

    describe( "arrays", () => {

        beforeEach( () => {
            const a = {
                field1: [ "one" ],
                field2: [],
                field3: [ "one", "two" ]
            }

            const b = {
                field1: [ "two" ],
                field2: [ "two" ],
                field3: [ "one" ]
            }

            diffs = DifferenceBuilder.getDiffs( a, b )
        } )

        it( "changed values", () => {
            assert.deepStrictEqual( diffs.edited[ 0 ], { "field1/0": { newValue: "two", oldValue: "one" } } )
        } )

        it( "new values", () => {
            assert.deepStrictEqual( diffs.new[ "field2/0" ], "two" )
        } )

        it( "removed values", () => {
            assert.deepStrictEqual( diffs.removed, { "field3/1": "two" } )
        } )
    } )
} )
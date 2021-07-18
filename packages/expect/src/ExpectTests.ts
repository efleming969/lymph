import Expect from "./Expect"
import * as assert from "assert"

const expect = ( actual ) => new Expect( actual )

describe( "expect", () => {

    it( "equality", () => {
        let caught

        try {
            expect( { name: "foo" } ).toEqual( { name: "bar" } )
        } catch ( error ) {
            caught = error
        }

        assert.deepStrictEqual( caught.message, `{"name":"foo"} not equal to {"name":"bar"}` )
    } )

    it( "lengths", () => {
        expect( [] ).toHaveLength( 0 )
        expect( [ "one", "two" ] ).toHaveLength( 2 )

        expect( () => {
            expect( [ "one" ] ).toHaveLength( 2 )
        } ).toThrow( "1 is not equal to 2" )
    } )

    it( "throws", () => {
        const functionThatThrows = () => {
            throw new Error( "wrong" )
        }

        expect( () => functionThatThrows() ).toThrow( "wrong" )
    } )

    it( "throws error object", () => {
        const functionThatThrows = () => {
            throw new Error( "wrong" )
        }

        const error = expect( () => functionThatThrows() ).toThrowError<Error>()

        expect( error.message ).toEqual( "wrong" )
    } )
} )

import DifferenceBuilder from "./DifferenceBuilder"
import AssertionError from "./AssertionError"
import { MessageBuilder, createMessageBuilder } from "./MessageBuilder"

export default class Expect {
    messageBuilder: MessageBuilder

    constructor( protected actual: any ) {
        this.messageBuilder = createMessageBuilder()
    }

    toEqual( expected: any ) {
        const diffs = DifferenceBuilder.getDiffs( this.actual, expected )

        if ( diffs.hasDiffs ) {
            throw new AssertionError(
              `${ JSON.stringify( this.actual ) } not equal to ${ JSON.stringify( expected ) }`,
              this.messageBuilder.messages
            )
        }
    }

    toBeNull(): void {
        if ( this.actual !== null ) {
            throw new AssertionError( "not null" )
        }
    }

    toNotBeNull(): void {
        if ( this.actual === null ) {
            throw new AssertionError( "was null" )
        }
    }

    toHaveLength( expected: number ) {
        if ( this.actual.length === undefined ) {
            throw new AssertionError( "does not have a length" )
        }

        if ( this.actual.length && this.actual.length !== expected ) {
            throw new AssertionError( this.actual.length + " is not equal to " + expected )
        }
    }

    toThrow( expectedMessage: string ) {
        let caught

        try {
            if ( typeof this.actual === "function" ) {
                this.actual()
            }
        } catch ( error ) {
            caught = error
        }

        if ( caught && caught.message !== expectedMessage ) {
            throw new AssertionError( `expected: ${ expectedMessage } but got: ${ caught.message }` )
        }

        if ( !caught ) {
            throw new AssertionError( `expected to throw with: ${ expectedMessage }` )
        }
    }

    toThrowError<T extends Error>(): T {
        let caught

        try {
            if ( typeof this.actual === "function" ) {
                this.actual()
            }
        } catch ( error ) {
            caught = error
        }

        if ( !caught ) {
            throw new AssertionError( `expected to throw` )
        }

        return caught
    }

    toBeFalse() {
        if ( typeof this.actual === "boolean" && this.actual === false ) {
            return
        }

        throw new AssertionError( `expected false` )
    }

    toBeTrue() {
        if ( typeof this.actual === "boolean" && this.actual === true ) {
            return
        }

        throw new AssertionError( `expected true` )
    }
}

import Expect from "./Expect"
import AssertionError from "./AssertionError"

const expect = ( actual: any ) => new Expect( actual )

export { AssertionError, Expect, expect }

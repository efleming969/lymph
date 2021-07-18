export default class AssertionError extends Error {
    constructor( message: string, private diffs?: any ) {
        super( message )
    }
}
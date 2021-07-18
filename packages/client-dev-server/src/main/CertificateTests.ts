import * as Certificate from "./Certificate"

describe( "certificates", () => {

    it( "generates self-signed certs", () => {
        let commands = []

        const fakeExec = ( command, args ) => {
            commands.push( `${ command } ${ args.join( " " ) }` )
        }

        let writes = []

        const fakeWriteFileSync = ( path, content ) => {
            writes.push( { path, content } )
        }

        Certificate.generate( "test-domain", fakeWriteFileSync, fakeExec )

        console.log( commands.join( "\n" ) )
        console.log( writes.map( x => x.content ).join( "\n" ) )
    } )
} )
import * as Certificate from "./Certificate"
import { expect } from "@efleming969/expect"

const createFakeEnvironment = function () {
    const commands = []

    const exec = ( command, args ) => {
        commands.push( `${ command } ${ args.join( " " ) }` )
    }

    const writes = []

    const writeFile = ( path, content ) => {
        writes.push( { path, content } )
    }

    return { commands, writes, exec, writeFile }
}

describe( "certificates", () => {

    it( "generates self-signed authority when one is not already created", () => {
        const environment = createFakeEnvironment()

        Certificate.generate( "test-domain", environment.writeFile, environment.exec )

        console.log( environment.commands.join( "\n" ) )
        // console.log( environment.writes.map( x => x.content ).join( "\n" ) )
    } )
} )
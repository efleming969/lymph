const Path = require( "path" )
const Server = require( "../lib/main/Server" )

const wd = __dirname

const options = {
    sourceDirectory: Path.join( wd, "src" ),
    buildDirectory: Path.join( wd, "static" ),
    key: Path.join( wd, "localhost05.key" ),
    crt: Path.join( wd, "localhost05.crt" ),
    port: 8080
}

const server = new Server.default( options )

server.start().then( () => {
} )

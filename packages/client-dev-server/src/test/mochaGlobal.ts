import Server from "../main/Server"
import * as Path from "path"

const cwd = process.cwd()

export const sourceDirectory = Path.join( cwd, "src", "test", "fixtures" )
export const buildDirectory = Path.join( cwd, "tmp" )

let server: Server

export const mochaGlobalSetup = async () => {
    const key = Path.join( sourceDirectory, "localhost.key" )
    const crt = Path.join( sourceDirectory, "localhost.crt" )

    server = new Server( { sourceDirectory, buildDirectory, crt, key } )
    await server.start()
}

export const mochaGlobalTeardown = async () => {
    await server.stop()
}

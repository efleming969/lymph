import Path from "path"
import { Server2 } from "@acme/client-dev-server"

const cwd = process.cwd()

const options = {
    sourceDirectory: Path.join( cwd, "src" ),
    buildDirectory: Path.join( cwd, "static" ),
    key: Path.join( cwd, "scripts", "localhost.key" ),
    crt: Path.join( cwd, "scripts", "localhost.crt" ),
    port: 9092
}

await new Server2( options ).start()

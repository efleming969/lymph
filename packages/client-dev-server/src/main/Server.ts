import * as Path from "path"
import * as FS from "fs"
import * as HTTP from "http2"
import * as TypeScript from "typescript"
import * as Chokidar from "chokidar"
import { transformBareImports, transformRelativeImports } from "./Utils.js"
import Mime from "./Mime.js"

const AsyncFS = FS.promises

const respondWith = function ( stream, responseHeaders, responseContent ) {
    try {
        stream.respond( responseHeaders )
        responseContent.forEach( content => stream.write( content ) )
        stream.end()
    } catch ( error ) {
        console.log( error )
    }
}

const parseDependencies = ( dependenciesToParse, rootDirectory ) => {
    const parsedDependencies = {}

    for ( const dependencyName in dependenciesToParse ) {
        const dependencyPackageDirectory = Path.join( rootDirectory, "node_modules", dependencyName )
        const dependencyPackageFile = Path.join( dependencyPackageDirectory, "package.json" )
        const dependencyPackageContent = FS.readFileSync( dependencyPackageFile, "utf8" )
        const dependencyPackageObject = JSON.parse( dependencyPackageContent )
        if ( dependencyPackageObject.module || dependencyPackageObject.type === "module" ) {
            const moduleFile = dependencyPackageObject.module || dependencyPackageObject.main
            parsedDependencies[ dependencyName ] = Path.join( "node_modules", dependencyName, moduleFile )
        }
    }

    return parsedDependencies
}

const loadDependencies = () => {
    const rootDirectory = process.cwd()
    const fileContents = FS.readFileSync( Path.join( rootDirectory, "package.json" ), "utf8" )
    const packageFileObject = JSON.parse( fileContents )
    const productionDependencies = parseDependencies( packageFileObject.dependencies, rootDirectory )
    const developmentDependencies = parseDependencies( packageFileObject.devDependencies, rootDirectory )

    return { ...productionDependencies, ...developmentDependencies }
}

//TODO: removed unused buildDirectory
type ServerOptions = {
    buildDirectory: string
    sourceDirectory: string
    key: string
    crt: string
    port?: number
}

export default class Server {
    server: HTTP.Http2Server
    tsConfig: any
    dependencies: any
    watcher: Chokidar.FSWatcher

    constructor( private options: ServerOptions ) {
        const tsConfigPath = TypeScript.findConfigFile( options.sourceDirectory, TypeScript.sys.fileExists,
          "tsconfig.json" )
        if ( !tsConfigPath ) {
            throw new Error( "Could not find a valid 'tsconfig.json'." )
        }
        this.tsConfig = JSON.parse( FS.readFileSync( tsConfigPath, "utf-8" ) )
        this.dependencies = loadDependencies()
    }

    async resolveScriptFilePath( filePath ) {
        // need to decide which file to actually transpile
        try {
            const fp = filePath.replace( ".js", ".tsx" )
            return [ await AsyncFS.stat( fp ), fp ]
        } catch {
        }

        try {
            const fp = filePath.replace( ".js", ".ts" )
            return [ await AsyncFS.stat( fp ), fp ]
        } catch {
        }

        return [ await AsyncFS.stat( filePath ), filePath ]
    }

    start() {
        const options = this.options
        const httpOptions = {
            key: FS.readFileSync( options.key ),
            cert: FS.readFileSync( options.crt )
        }

        this.server = HTTP.createSecureServer( httpOptions )
        this.watcher = Chokidar.watch( options.sourceDirectory, {} )

        return new Promise<void>( ( resolve ) => {

            this.server.on( "stream", async ( stream, requestHeaders ) => {
                const responseHeaders = {}
                const responseContent = []

                try {
                    const scheme = String( requestHeaders[ HTTP.constants.HTTP2_HEADER_SCHEME ] )
                    const authority = String( requestHeaders[ HTTP.constants.HTTP2_HEADER_AUTHORITY ] )
                    const path = String( requestHeaders[ HTTP.constants.HTTP2_HEADER_PATH ] )
                    const url = new URL( path, `${ scheme }://${ authority }` )
                    const requestedFilePath = url.pathname === "/" ? "index.html" : url.pathname
                    const requestedFileExtension = Path.extname( requestedFilePath )
                    const fullRequestFilePath = Path.join( options.sourceDirectory, requestedFilePath )

                    if ( url.pathname === "/reload" ) {
                        stream.respond( {
                            [ HTTP.constants.HTTP2_HEADER_CONTENT_TYPE ]: "text/event-stream"
                        } )

                        stream.write( `event: started\n` )
                        stream.write( `data: \n\n` )

                        const listener = ( path ) => {
                            stream.write( `event: changed\n` )
                            stream.write( `data: ${ path }\n\n` )
                        }

                        this.watcher.on( "change", listener )

                        stream.on( "close", () => {
                            this.watcher.off( "change", listener )
                        } )
                    } else if ( url.pathname.startsWith( "/node_modules" ) ) {
                        const moduleFile = Path.join( process.cwd(), requestedFilePath )
                        const moduleStats = await AsyncFS.stat( moduleFile )
                        const eTag = `${ moduleStats.size }-${ moduleStats.mtime.getTime() }`
                        const ifNoneMatch = requestHeaders[ HTTP.constants.HTTP2_HEADER_IF_NONE_MATCH ]

                        if ( ifNoneMatch && ifNoneMatch === eTag ) {
                            responseHeaders[ HTTP.constants.HTTP2_HEADER_STATUS ] = 304
                        } else {
                            responseHeaders[ HTTP.constants.HTTP2_HEADER_STATUS ] = 200
                            responseHeaders[ HTTP.constants.HTTP2_HEADER_CONTENT_TYPE ] = Mime.byExtension( ".js" )
                            responseHeaders[ HTTP.constants.HTTP2_HEADER_ETAG ] = eTag
                            responseHeaders[ HTTP.constants.HTTP2_HEADER_CACHE_CONTROL ] = "no-cache"
                            responseContent.push( await AsyncFS.readFile( moduleFile, "utf8" ) )
                        }

                        respondWith( stream, responseHeaders, responseContent )
                    } else if ( requestedFileExtension === ".js" ) {
                        const [ stats, path ] = await this.resolveScriptFilePath( fullRequestFilePath )
                        const eTag = `${ stats.size }-${ stats.mtime.getTime() }`
                        const ifNoneMatch = requestHeaders[ HTTP.constants.HTTP2_HEADER_IF_NONE_MATCH ]

                        if ( ifNoneMatch && ifNoneMatch === eTag ) {
                            responseHeaders[ HTTP.constants.HTTP2_HEADER_STATUS ] = 304
                        } else {
                            const source = await AsyncFS.readFile( path, "utf8" )
                            const trueFileExtension = Path.extname( path.toString() )
                            const relativeFilePath = url.toString().replace( ".js", trueFileExtension )

                            const config = {
                                ...this.tsConfig,
                                fileName: relativeFilePath
                            }

                            config.compilerOptions.inlineSourceMap = true
                            config.compilerOptions.inlineSources = true
                            config.compilerOptions.module = TypeScript.ModuleKind.ES2020

                            const source1 = await transformBareImports( source, ( moduleName ) => {
                                return Path.join( "/", this.dependencies[ moduleName ] ).replace( /\\/g, "/" )
                            } )

                            const source2 = await transformRelativeImports( source1 )

                            const transpiledModule = TypeScript.transpileModule( source2, config )

                            responseContent.push( transpiledModule.outputText )
                            responseHeaders[ HTTP.constants.HTTP2_HEADER_STATUS ] = 200
                            responseHeaders[ HTTP.constants.HTTP2_HEADER_ETAG ] = eTag
                            responseHeaders[ HTTP.constants.HTTP2_HEADER_CONTENT_TYPE ] = Mime.byExtension( ".js" )
                            responseHeaders[ HTTP.constants.HTTP2_HEADER_CACHE_CONTROL ] = "no-cache"
                        }

                        respondWith( stream, responseHeaders, responseContent )
                    } else {
                        const contentType = requestedFileExtension === ""
                          ? "text/html"
                          : Mime.byExtension( requestedFileExtension )

                        const fileToLoad = requestedFileExtension === ""
                          ? Path.join( this.options.sourceDirectory, "index.html" )
                          : fullRequestFilePath

                        const fileStats = await AsyncFS.stat( fileToLoad )
                        const eTag = `${ fileStats.size }-${ fileStats.mtime.getTime() }`
                        const ifNoneMatch = requestHeaders[ HTTP.constants.HTTP2_HEADER_IF_NONE_MATCH ]

                        if ( ifNoneMatch && ifNoneMatch === eTag ) {
                            responseHeaders[ HTTP.constants.HTTP2_HEADER_STATUS ] = 304
                        } else {
                            responseHeaders[ HTTP.constants.HTTP2_HEADER_STATUS ] = 200
                            responseHeaders[ HTTP.constants.HTTP2_HEADER_CONTENT_TYPE ] = contentType
                            responseHeaders[ HTTP.constants.HTTP2_HEADER_ETAG ] = eTag
                            responseHeaders[ HTTP.constants.HTTP2_HEADER_CACHE_CONTROL ] = "no-cache"

                            responseContent.push( await AsyncFS.readFile( fileToLoad, "utf8" ) )

                            if ( contentType === "text/html" ) {
                                responseContent.push( `
                                <script>
                                    const reloadEventSource = new EventSource( "/reload" )

                                    reloadEventSource.addEventListener( "started", () => {
                                        console.log("sse started") 
                                    } )
                                    
                                    reloadEventSource.addEventListener( "changed", () => {
                                        window.location.reload()
                                    } )
                                    
                                    reloadEventSource.onerror = () => reloadEventSource.close()
                                </script>
                            ` )
                            }
                        }

                        respondWith( stream, responseHeaders, responseContent )
                    }
                } catch ( error ) {
                    let status = 500
                    if ( error.code === "ENOENT" ) {
                        status = 404
                    } else {
                        const scheme = String( requestHeaders[ HTTP.constants.HTTP2_HEADER_SCHEME ] )
                        const authority = String( requestHeaders[ HTTP.constants.HTTP2_HEADER_AUTHORITY ] )
                        const path = String( requestHeaders[ HTTP.constants.HTTP2_HEADER_PATH ] )
                        const url = new URL( path, `${ scheme }://${ authority }` )
                        console.log( error )
                        console.log( "fail to process", url.toString() )
                    }
                    responseHeaders[ HTTP.constants.HTTP2_HEADER_STATUS ] = status
                    respondWith( stream, responseHeaders, [] )
                }
            } )

            this.server.listen( options.port || 9091, "0.0.0.0", () => {
                console.log( "Server(v5) listening on port:", options.port || 9091 )
                resolve()
            } )
        } )
    }

    stop() {
        console.log( "stopping watcher" )
        return this.watcher.close().then( () => {
            console.log( "stopping server" )
            this.server.close()
        } )
    }
}
import { writeFileSync as nativeWriteFileSync, writeFileSync } from "fs"
import { execSync } from "child_process"

type FileWriter = ( name: string, contents: string, encoding: string ) => void

const nativeExec = ( name: string, args: string[] ) => {
    execSync( `${ name } ${ args.join( " " ) }` )
}

export const generate = ( name: string, writeFile: FileWriter = nativeWriteFileSync, exec = nativeExec ) => {
    const openssl = ( command: string, args: string[] ) => ( exec( `openssl ${ command }`, args ) )

    const sslConfigContents = `
[req]
prompt = no
distinguished_name = options

[options]
C = US
ST = State
L = Locality
O = Company
CN = servor
`
    writeFile( name + ".cnf", sslConfigContents, "utf8" )

    // Generate private key for CA certificate
    openssl( "genrsa", [
        `-out ${ name }-ca.key`,
        "2048"
    ] )

    const country = "US"
    const state = "State"
    const locality = "Locality"
    const organization = "Company"
    const common_name = name
    const organization_unit = name
    const email = "name@example.com"

    // Generate CA certificate
    openssl( "req", [
        "-new",
        "-x509",
        "-nodes",
        "-sha256",
        "-days 825",
        `-config ${ name }.cnf`,
        `-key ${ name }-ca.key`,
        `-out ${ name }-ca.pem`
    ] )

    // Generate private key for signed certificate
    openssl( "genrsa", [
        `-out ${ name }.key`,
        "2048"
    ] )

    // Create a certificate-signing request
    openssl( "req", [
        "-new",
        `-config ${ name }.cnf`,
        `-key ${ name }.key`,
        `-out ${ name }.csr`

    ] )

    // create certificated configuration
    let configFileContents = `
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage=digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment
subjectAltName=@alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = 127.0.0.1
DNS.3 = ::1
`

    writeFile( name + ".ext", configFileContents, "utf8" )

    // create the signed certificate
    openssl( "x509", [
        "-req",
        `-in ${ name }.csr`,
        `-CA ${ name }-ca.pem`,
        `-CAkey ${ name }-ca.key`,
        "-CAcreateserial",
        `-out ${ name }.crt`,
        "-days 825",
        "-sha256",
        `-extfile ${ name }.ext`
    ] )
}

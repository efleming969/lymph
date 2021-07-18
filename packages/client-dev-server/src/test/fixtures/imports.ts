import { expect } from "@lymph/expect"
import * as RegexParams from "regexparam"
import foo from "./imports-foo"

try {
    expect( "foo" ).toEqual( "foo" )
    document.body.append( document.createTextNode( "scope" ) )
} catch {
}

if ( RegexParams.parse( "/things/:id" ).pattern.test( "/things/1" ) ) {
    document.body.append( document.createTextNode( "bare" ) )
}

document.body.append( document.createTextNode( foo() ) )

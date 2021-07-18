import { expect } from "@lymph/expect"
import browserUtils from "./browserUtils.js"
import { Page } from "playwright"

describe( "script files", function () {
    let page: Page

    before( async () => {
        await browserUtils.start()
    } )

    after( async () => {
        await browserUtils.stop()
    } )

    beforeEach( async () => {
        page = await browserUtils.newPageAt( "/scripts.html" )
    } )

    it( "js files", async function () {
        expect( await page.waitForSelector( "text=hello, javascript" ) ).toNotBeNull()
    } )

    it( "ts files", async function () {
        expect( await page.waitForSelector( "text=hello, typescript" ) ).toNotBeNull()
    } )

    it( "tsx files", async function () {
        expect( await page.waitForSelector( "text=hello, tsx" ) ).toNotBeNull()
    } )

    it( "returns a 304 response for files that are unchanged", async function () {
        return new Promise( async function ( resolve, reject ) {
            let count = 0

            page.on( "requestfinished", async ( request ) => {
                const response = await request.response()
                const status = await response.status()
                const url = await response.url()

                if ( url.endsWith( "cached.js" ) && count === 1 ) {
                    if ( status === 304 ) {
                        resolve()
                    } else {
                        reject( "not cached" )
                    }
                } else if ( url.endsWith( "cached.js" ) && count === 0 ) {
                    count = 1
                }
            } )

            try {
                await page.goto( `https://localhost:9091/cached.html` )
                await page.waitForSelector( "text=hello" )
                await page.reload()
                await page.waitForSelector( "text=hello" )
            } catch ( error ) {
            }
        } )
    } )
} )

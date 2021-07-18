import { expect } from "@lymph/expect"
import browserUtils from "./browserUtils"

describe( "static files", function () {

    before( async () => {
        await browserUtils.start()
    } )

    after( async () => {
        await browserUtils.stop()
    } )

    it( "renders html files", async function () {
        const page = await browserUtils.newPageAt( "/index.html" )

        expect( await page.title() ).toEqual( "Home" )
    } )

    it( "renders index.html for root path", async function () {
        const page = await browserUtils.newPageAt( "/" )

        expect( await page.title() ).toEqual( "Home" )
    } )

    it( "renders index.html for paths without extensions", async function () {
        const page = await browserUtils.newPageAt( "/file-without-extension" )

        expect( await page.title() ).toEqual( "Home" )
    } )

    it( "renders css files", async function () {
        const page = await browserUtils.newPageAt( "/styles.html" )

        expect( await page.waitForSelector( "#app", { state: "hidden" } ) ).toBeNull()
    } )

    it( "returns a 404 error when file is not found", async function () {
        const page = await browserUtils.newPage()

        return new Promise( async ( resolve ) => {
            page.on( "request", async ( request ) => {
                const response = await request.response()

                if ( response.url().endsWith( "/not-found.html" ) && response.status() === 404 ) {
                    resolve()
                }
            } )

            await page.goto( `https://localhost:9091/not-found.html` )
        } )

    } )

    it( "returns a 304 response for styles that are unchanged", async () => {
        const page = await browserUtils.newPageAt( "/styles.html" )

        return new Promise( async function ( resolve, reject ) {
            page.on( "requestfinished", async ( request ) => {
                const response = await request.response()
                const url = response.url()

                if ( url.endsWith( "styles.css" ) ) {
                    if ( response.status() === 304 ) {
                        resolve()
                    } else {
                        reject( "not cached" )
                    }
                }
            } )

            await page.waitForSelector( "#app", { state: "hidden" } )
            await page.reload()
        } )
    } )
} )
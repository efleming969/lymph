import { expect } from "@lymph/expect"
import browserUtils from "./browserUtils.js"
import { Page } from "playwright"

describe( "import", function () {
    let page: Page

    before( async () => {
        await browserUtils.start()
    } )

    after( async () => {
        await browserUtils.stop()
    } )

    beforeEach( async () => {
        page = await browserUtils.newPageAt( "/imports.html" )
    } )

    it( "handles scoped imports", async function () {
        expect( await page.waitForSelector( "text=scope" ) ).toNotBeNull()
    } )

    it( "handles bare imports", async function () {
        expect( await page.waitForSelector( "text=bare" ) ).toNotBeNull()
    } )

    it( "handles relative imports", async function () {
        expect( await page.waitForSelector( "text=relative" ) ).toNotBeNull()
    } )

} )

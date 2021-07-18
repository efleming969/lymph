import * as Path from "path"
import { promises as FS } from "fs"
import { sourceDirectory } from "./mochaGlobal.js"
import browserUtils from "./browserUtils.js"

const changeReloadFile = ( fileName: string ) => ( contents: string ) =>
  FS.writeFile( Path.join( sourceDirectory, fileName ), contents, "utf8" )

const changeScriptFile = changeReloadFile( "reload.js" )
const changeStyleFile = changeReloadFile( "reload.css" )

describe( "reload", function () {

    before( async () => {
        await browserUtils.start()
    } )

    after( async () => {
        await browserUtils.stop()
        await changeScriptFile( "" )
        await changeStyleFile( "" )
    } )

    it( "updates page when script files are changed", async () => {
        const page = await browserUtils.newPageAt( "/reload.html" )
        await page.waitForSelector( "text=default" )

        await changeScriptFile( `document.getElementById("scripted").textContent = 'hello'` )
        await page.waitForSelector( "text=hello" )

        await changeScriptFile( `document.getElementById("scripted").textContent = 'world'` )
        await page.waitForSelector( "text=world" )
    } )

    it( "updates page when style files are changed", async () => {
        const page = await browserUtils.newPageAt( "/reload.html" )
        await page.waitForSelector( "#styled", { state: "visible" } )

        await changeStyleFile( "#styled { display: none; }" )

        await page.waitForSelector( "#styled", { state: "hidden" } )
    } )
} )
import { Browser, BrowserContext, chromium } from "playwright"

const disableHeadless = !( process.env.DISABLE_HEADLESS !== undefined )

class BrowserUtils {
    browser: Browser
    browserContext: BrowserContext

    async start() {
        this.browser = await chromium.launch( { devtools: false, headless: disableHeadless } )
        this.browserContext = await this.browser.newContext( {} )
        this.browserContext.setDefaultTimeout( 3000 )
    }

    async stop() {
        await this.browser.close()
    }

    async newPage() {
        return await this.browserContext.newPage()
    }

    async newPageAt( pathname: string ) {
        const page = await this.browserContext.newPage()
        await page.goto( `https://localhost:9091${ pathname }` )
        return page
    }
}

export default new BrowserUtils()

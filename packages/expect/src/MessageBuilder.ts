export interface MessageBuilder {
    messages: string[]

    log( text: string ): void

    logRed( text: string ): void

    logGreen( text: string ): void

    logSkip( text: string ): void
}

enum ConsoleColors {
    Reset = "\x1b[0m",
    FgRed = "\x1b[31m",
    FgGreen = "\x1b[32m",
    FgYellow = "\x1b[33m",
}

class NodeMessageBuilder implements MessageBuilder {
    messages: string[] = []

    log( text: string ): void {
        this.messages.push( text )
    }

    logGreen( text: string ): void {
        this.messages.push( `${ ConsoleColors.FgGreen }${ text }${ ConsoleColors.Reset }` )
    }

    logRed( text: string ): void {
        this.messages.push( `${ ConsoleColors.FgRed }${ text }${ ConsoleColors.Reset }` )
    }

    logSkip( text: string ): void {
        this.messages.push( `${ ConsoleColors.FgYellow }${ text }${ ConsoleColors.Reset }` )
    }
}

class BrowserMessageBuilder implements MessageBuilder {
    messages: string[] = []

    log( text: string ): void {
        this.messages.push( text )
    }

    logGreen( text: string ): void {
        this.messages.push( `${ ConsoleColors.FgGreen }${ text }${ ConsoleColors.Reset }` )
    }

    logRed( text: string ): void {
        this.messages.push( `${ ConsoleColors.FgRed }${ text }${ ConsoleColors.Reset }` )
    }

    logSkip( text: string ): void {
        this.messages.push( `${ ConsoleColors.FgYellow }${ text }${ ConsoleColors.Reset }` )
    }
}

const detectIfBrowser = new Function( "try {return this===window;}catch(e){ return false;}" )

export const createMessageBuilder = function (): MessageBuilder {
    return detectIfBrowser() ? new BrowserMessageBuilder() : new NodeMessageBuilder()
}



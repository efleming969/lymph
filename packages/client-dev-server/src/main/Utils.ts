const importSpecifierRegex = /import(?:["'\s]*[\w*${}\n\r\t, ]+from\s*)?["'\s]["'\s]([@\w_/-]+)["'\s].*;?$/gm

export const transformBareImports = ( source, resolveImport ) => {
    return source.replace( importSpecifierRegex, ( importStatement, moduleName ) => {
        if ( importStatement.startsWith( "import type" ) ) {
            return importStatement
        }

        return importStatement.replace( /["'].*["']/, `"${ resolveImport( moduleName ) }"` )
    } )
}

const relativeImportRegex = /(?:import|export)(?:["'\s]*[\w*${}\n\r\t, ]+from\s*)?["'\s]["'\s](.{1,2}\/[.\/a-zA-Z0-9\-]*)["'\s].*;?$/gm

export const transformRelativeImports = ( source ) => {
    return source.replace( relativeImportRegex, ( importStatement, moduleName ) => {
        if ( moduleName.endsWith( ".js" ) )
            return importStatement
        else
            return importStatement.replace( moduleName, `${ moduleName }.js` )
    } )
}
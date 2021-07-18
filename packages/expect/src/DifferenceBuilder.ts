type DefaultValue = number | string | boolean;

export type EditedPaths = Array<{ [ key: string ]: { newValue: DefaultValue; oldValue: DefaultValue } }>

export interface IStructPaths {
    [ key: string ]: DefaultValue
}

export interface IPathsDiff {
    [ key: string ]: DefaultValue
}

export interface IDelta {
    new: IPathsDiff
    removed: IPathsDiff
    edited: EditedPaths
    hasDiffs: boolean
}

export default class DifferenceBuilder {

    public static getDiffs( oldStruct: any, newStruct: any ): IDelta {
        const delta: IDelta = {
            new: {},
            removed: {},
            edited: [],
            get hasDiffs() {
                const hasNew = Object.keys( this.new ).length > 0
                const hasRemoved = Object.keys( this.removed ).length > 0
                const hasEdited = this.edited.length > 0

                return hasNew || hasRemoved || hasEdited
            }
        }

        const oldStructPaths = this.getStructPaths( oldStruct )
        const newStructPaths = this.getStructPaths( newStruct )

        // A-B
        delta.removed = this.getPathsDiff( oldStructPaths, newStructPaths )
        // B-A
        delta.new = this.getPathsDiff( newStructPaths, oldStructPaths )
        // a->b
        delta.edited = this.getEditedPaths( oldStructPaths, newStructPaths )

        return delta
    }

    private static getStructPaths( struct: any, paths: IStructPaths = {}, currentPath = "" ): IStructPaths {
        for ( const key of Object.keys( struct ) ) {
            const path = currentPath !== "" ? `${ currentPath }/${ key }` : key

            if ( typeof struct[ key ] === "object" ) {
                this.getStructPaths( struct[ key ], paths, path )
            } else {
                paths[ path ] = struct[ key ]
            }
        }

        return paths
    }

    // Difference by key
    private static getPathsDiff( oldStructPaths: IStructPaths, newStructPaths: IStructPaths ): IPathsDiff {
        const diff: IPathsDiff = {}

        for ( const key in oldStructPaths ) {
            if ( !( key in newStructPaths ) ) {
                diff[ key ] = oldStructPaths[ key ]
            }
        }

        return diff
    }

    // Difference by value
    private static getEditedPaths( oldStructPaths: IStructPaths, newStructPaths: IStructPaths ): EditedPaths {
        const diffs: EditedPaths = []
        let diff: any = {}

        for ( const key in oldStructPaths ) {
            if ( newStructPaths.hasOwnProperty( key ) ) {
                if ( oldStructPaths[ key ] !== newStructPaths[ key ] ) {
                    diff = {
                        [ key ]: {
                            oldValue: oldStructPaths[ key ],
                            newValue: newStructPaths[ key ]
                        }
                    }
                    diffs.push( diff )
                }
            }
        }

        return diffs
    }
}

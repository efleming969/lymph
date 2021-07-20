import { promises as FS } from "fs"
import * as Path from "path"
import * as Crypto from "crypto"
import * as PG from "pg"

const generateHash = ( s ) => Crypto.createHash( "sha1" ).update( s, "utf8" ).digest( "hex" )

const dir = process.cwd()

type MigrationConfig = {
    host: string
    user: string
    password: string
    database: string
}

export async function run( config: MigrationConfig ) {
    const client = new PG.Client( config )

    const ensureMigrationsTable = async function () {

        // noinspection SqlNoDataSourceInspection, SqlResolve
        const sql = `
            CREATE TABLE IF NOT EXISTS migrations (
                id          SERIAL PRIMARY KEY,
                type        INT                 NOT NULL,
                name        VARCHAR(255) UNIQUE NOT NULL,
                hash        VARCHAR(255) UNIQUE NOT NULL,
                executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `
        await client.query( sql )

        console.log( "Migrations table exists" )
    }

    const getMigrations = async function ( migrationType ) {
        const directoryPath = Path.join( dir, "migrations", migrationType )

        const files = await FS.readdir( directoryPath )

        const migrations = []
        for ( const fileName of files ) {
            const fileContents = await FS.readFile( Path.resolve( directoryPath, fileName ), "utf8" )
            const hash = generateHash( fileName + fileContents )
            const type = migrationType === "versioned" ? 0 : 1
            migrations.push( { fileName, fileContents, hash, type } )
        }

        console.log( "Read all migrations from:" + directoryPath )

        return migrations
    }

    const insertMigrationRecord = async function ( migration ) {
        // noinspection SqlNoDataSourceInspection, SqlResolve
        const sql = `
            INSERT INTO
                migrations(type, name, hash)
                VALUES
                    ($1, $2, $3);
        `

        await client.query( sql, [ migration.type, migration.fileName, migration.hash ] )
    }

    const getAppliedMigration = async function ( migration ) {
        // noinspection SqlNoDataSourceInspection, SqlResolve
        const sql = `
            SELECT id, name, hash, type
                FROM
                    migrations
                WHERE
                    name = $1
        `

        const appliedMigrationsResponse = await client.query( sql, [ migration.fileName ] )
        const appliedMigration = appliedMigrationsResponse.rows[ 0 ]

        if ( appliedMigration && appliedMigration.type === 0 && appliedMigration.hash !== migration.hash )
            throw new Error( `Migration was changed: ${ migration.fileName }` )

        return appliedMigration
    }

    const updateMigrationRecord = async function ( migration ) {
        // noinspection SqlNoDataSourceInspection, SqlResolve
        const sql = `
            UPDATE migrations
            SET
                hash = $1
                WHERE
                    name = $2;
        `

        await client.query( sql, [ migration.hash, migration.fileName ] )
    }

    const printResultsReport = function ( listOfMigrationsToApply, type ) {
        const migrations = listOfMigrationsToApply.filter( x => x.type === type )

        if ( migrations.length === 0 )
            console.log( "--> No migration ran" )
        else
            migrations.forEach( x => console.log( "--> " + x.fileName ) )
    }

    await client.connect()

    const listOfMigrationsToApply = []

    await ensureMigrationsTable()

    try {
        await client.query( "START TRANSACTION" )

        const versionedMigrations = await getMigrations( "versioned" )

        for ( let migration of versionedMigrations ) {
            const appliedMigration = await getAppliedMigration( migration )

            if ( appliedMigration === undefined ) {
                listOfMigrationsToApply.push( migration )
                await client.query( migration.fileContents )
                await insertMigrationRecord( migration )
            }

        }

        const repeatableMigrations = await getMigrations( "repeatable" )

        for ( let migration of repeatableMigrations ) {
            const appliedMigration = await getAppliedMigration( migration )

            if ( appliedMigration && appliedMigration.hash === migration.hash ) {
                console.log( "skipped migration", migration.fileName )
            } else if ( appliedMigration && appliedMigration.hash !== migration.hash ) {
                listOfMigrationsToApply.push( migration )
                await client.query( migration.fileContents )
                await updateMigrationRecord( migration )
            } else {
                listOfMigrationsToApply.push( migration )
                await client.query( migration.fileContents )
                await insertMigrationRecord( migration )
            }
        }

        await client.query( "COMMIT" )
    } catch ( error ) {
        console.log( error.message,
          listOfMigrationsToApply[ listOfMigrationsToApply.length - 1 ].fileContents )
        console.log( "" )
        await client.query( "ROLLBACK" )
    } finally {
        await client.end()
    }

    console.log( "Versioned migrations" )
    printResultsReport( listOfMigrationsToApply, 0 )
    console.log( "" )

    console.log( "Repeatable migrations" )
    printResultsReport( listOfMigrationsToApply, 1 )
    console.log( "" )
}
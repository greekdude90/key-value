/*
Key/Value pair database that saves pairs in a json file, and cached in memory on the server.
*/

import { Injectable, OnModuleInit } from '@nestjs/common';
import { promises as fs } from 'fs';
import util from 'util';

@Injectable()
export class KeyValueDB implements OnModuleInit {
	dbFile: string = "db.json";
	cache!: { [key:string]: (string|number|boolean) };
	batchDelimiter: string = ';';
	batchKVDelimiter: string = '=';

	async onModuleInit(){
		await this.Open();
	}

	// If the db file does not exist, attempt to create an empty db file
	public async Open(){
		try{
			const dbString: string = await fs.readFile( this.dbFile, 'utf8' );

			this.cache = JSON.parse( dbString );
		}catch( readErr ){
			console.info( "Database does not exist, attempting to create a new database" );

			try{
				this.cache = {};
				this.Save();
				console.info( "Successfully created a new database" );
			}catch( createErr ){
				throw createErr;
			}
		}
	}

	async Save(){
		try{
			await fs.writeFile( this.dbFile, JSON.stringify( this.cache ) );
		}catch( createErr ){
			console.error( createErr );
			throw createErr;
		}
	}

	public GetValue( key: string ) : (string|number|boolean) {
		return this.cache[key];
	}

	// Set key/value pair.  If issue with saving data, revert value in cache
	public async SetKeyValue( key: string, value: string ){
		let previousValue: (string|number|boolean) = this.cache[key];
		this.cache[key] = value;

		try{
			await this.Save();
		}catch( err ){
			this.cache[key] = previousValue;
			throw err;
		}
	}

	public async BatchSetKeyValues( batch: object ) : Promise<boolean> {
		let noNulls: boolean = true;
		let cacheCopy: string = JSON.stringify( this.cache );

		for( const [key, value] of Object.entries( batch ) ){
			if( value !== null ){
				this.cache[key] = value;
			}else{
				noNulls = false;
			}
		}

		try{
			await this.Save();
		}catch( err ){
			this.cache = JSON.parse( cacheCopy );
			throw err;
		}

		return noNulls;
	}

	// Deletes key entry.  If issue with deletion, restore value to the cache
	public async DeleteKey( key: string ) : Promise<boolean> {
		let previousValue: (string|number|boolean) = this.cache[key];
		let removed: boolean = false;

		if( this.cache[key] !== undefined ){
			delete this.cache[key];

			try{
				await this.Save();
				removed = true;
			}catch( err ){
				this.cache[key] = previousValue;
				throw err;
			}
		}

		return removed;
	}
}

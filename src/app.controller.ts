import { Controller, Get, Put, Delete, Param, Res, Req, Header } from '@nestjs/common';

import { KeyValueDB } from './services/keyvalueDB.service';

@Controller( 'store' )
export class AppController {
	private allowedContentTypeSingle: string = 'text/plain; charset=utf-8';
	private allowedContentTypeBatch: string = 'application/json; charset=utf-8';

	constructor( private db: KeyValueDB ){}

	// GET store/<key>
	// returns a single key value pair
	@Get( ':key' )
	getValue( @Param( 'key' ) key: string, @Res() res ){
		let value = this.db.GetValue( key );

		if( value !== undefined ){
			res.status( 200 ).send( value );
		}else{
			res.status( 404 ).send( `Key, ${key}, not found` );
		}
	}

	// PUT store/<key>
	// allows upserting a single key value pair
	@Put( ':key' )
	async putValue( @Param( 'key' ) key: string, @Res() res, @Req() req ){
		if( req.headers['content-type'].toLowerCase() === this.allowedContentTypeSingle ){
			if( req.body.length > 0 ){
				try{
					await this.db.SetKeyValue( key, req.body );
					res.status( 204 );
				}catch( err ){
					res.status( 500 );
				}
			}else{
				res.status( 400 ).send( "No content in body" );
			}
		}else{
			res.status( 415 ).send( `Invalid Content-Type.  Must be: "Content-Type: ${this.allowedContentTypeSingle}".` );
		}
	}

	// PUT store
	// endpoint for uploading multiple key value pairs at once
	// null values passed are ignored, and a 415 status code is returned
	@Put()
	async putBatchSet( @Res() res, @Req() req ){
		if( req.headers['content-type'].toLowerCase() === this.allowedContentTypeBatch ){
			try{
				if( await this.db.BatchSetKeyValues( req.body ) ){
					res.status( 200 ).send( "All pairs successfully saved" );
				}else{
					res.status( 415 ).send( "Not all pairs saved, null values are not allowed" );
				}
			}catch( err ){
				res.status( 500 );
			}
		}else{
			res.status( 415 ).send( `Invalid Content-Type.  Must be: "Content-Type: ${this.allowedContentTypeBatch}".` );
		}
	}

	// DELETE store/<key>
	// deletes a single key value pair
	@Delete( ':key' )
	async deleteValue( @Param( 'key' ) key: string, @Res() res ){
		try{
			if( await this.db.DeleteKey( key ) ){
				res.status( 204 );
			}else{
				res.status( 404 ).send( `Key, ${key}, not found, nothing deleted` );
			}
		}catch( err ){
			res.status( 500 );
		}
	}
}

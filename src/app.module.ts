import { Module } from '@nestjs/common';
import { AppController } from './app.controller';

import { KeyValueDB } from './services/keyvalueDB.service';

@Module({
	imports: [],
	controllers: [AppController],
	providers: [
		KeyValueDB
	],
})
export class AppModule {}

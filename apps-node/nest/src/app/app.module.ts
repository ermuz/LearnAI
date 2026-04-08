import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AiModule } from '../modules/ai/ai.module';
import { GlobalModule } from './global.module';

@Module({
  imports: [GlobalModule, AiModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { ToolsModule } from './tools/tools.module';
import { AiV2Service } from './ai-v2.service';

@Module({
  imports: [ToolsModule],
  controllers: [AiController],
  providers: [AiService, AiV2Service],
})
export class AiModule {}

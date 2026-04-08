import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Logger,
  Post,
  Query,
  Res,
  Sse,
} from '@nestjs/common';
import { AiService } from './ai.service';
import { from, map } from 'rxjs';
import { AiV2Service } from './ai-v2.service';
import { UIMessage, pipeUIMessageStreamToResponse } from 'ai';
import { ServerResponse } from 'node:http';

@Controller('ai')
export class AiController {
  private readonly logger = new Logger(AiController.name);

  constructor(
    private readonly aiService: AiService,
    private readonly aiV2Service: AiV2Service,
  ) {}

  @Get('chat')
  query(@Query('query') query: string) {
    this.logger.log(`GET /ai/query/user query=${query}`);
    return this.aiService.runAgentWithTools(query);
  }

  @Sse('chat/stream')
  stream(@Query('query') query: string) {
    this.logger.log(`SSE /ai/chat/stream query=${query}`);
    return from(this.aiService.streamAgentWithTools(query)).pipe(
      map((chunk) => ({ data: chunk })),
    );
  }

  @Post('chat/stream')
  async streamV2(
    @Body() body: { messages?: UIMessage[] },
    @Res({ passthrough: false }) res: Response,
  ) {
    if (!body?.messages || !Array.isArray(body.messages)) {
      throw new BadRequestException('Invalid JSON');
    }
    this.logger.log(`streamV2 messages=${JSON.stringify(body.messages)}`);

    const stream = await this.aiV2Service.stream(body.messages);
    pipeUIMessageStreamToResponse({
      response: res as unknown as ServerResponse,
      stream,
    });
  }
}

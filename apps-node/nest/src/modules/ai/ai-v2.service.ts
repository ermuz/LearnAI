import { ChatOpenAI } from '@langchain/openai';
import { Inject, Logger } from '@nestjs/common';
import { SEND_MAIL_TOOL, WEB_SEARCH_TOOL } from './tools/tokens';
import { DynamicTool } from '@langchain/core/tools';
import { AIMessageChunk, createAgent } from 'langchain';
import { UIMessage } from 'ai';
import { toBaseMessages, toUIMessageStream } from '@ai-sdk/langchain';

export class AiV2Service {
  private readonly logger = new Logger(AiV2Service.name);
  private readonly chatModelWithTools: ReturnType<typeof createAgent>;
  constructor(
    @Inject('CHAT_MODEL')
    private readonly chatModel: ChatOpenAI,
    @Inject(WEB_SEARCH_TOOL)
    private readonly webSearchTool: DynamicTool<string>,
    @Inject(SEND_MAIL_TOOL)
    private readonly sendMailTool: DynamicTool<string>,
  ) {
    this.chatModelWithTools = createAgent({
      model: this.chatModel,
      tools: [this.webSearchTool, this.sendMailTool],
      systemPrompt:
        '你是 AI 助手，需要最新信息、事实核查或联网信息时，请使用 web_search 工具搜索后再作答。',
    });
  }
  async stream(messages: UIMessage[]) {
    const lcMessages = await toBaseMessages(messages);
    const lgStream = await this.chatModelWithTools.stream(
      { messages: lcMessages },
      {
        streamMode: ['messages', 'values'],
        recursionLimit: 12,
      },
    );

    return toUIMessageStream(lgStream as AsyncIterable<AIMessageChunk>);
  }
}

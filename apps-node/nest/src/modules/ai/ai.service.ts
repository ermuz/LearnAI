import { Inject, Injectable, Logger } from '@nestjs/common';

import { ChatOpenAI } from '@langchain/openai';
// import { z } from 'zod';
// import { tool } from '@langchain/';
import { Runnable } from '@langchain/core/runnables';
import {
  AIMessage,
  AIMessageChunk,
  BaseMessage,
  HumanMessage,
  SystemMessage,
  ToolMessage,
} from '@langchain/core/messages';
import { DynamicTool } from '@langchain/core/tools';
import {
  CREATE_USER_TOOL,
  CRON_JOB_TOOL,
  DELETE_USER_TOOL,
  GET_USER_TOOL,
  LIST_USERS_TOOL,
  SEND_MAIL_TOOL,
  UPDATE_USER_TOOL,
  WEB_SEARCH_TOOL,
} from './tools/tokens';
import {
  CRON_JOB_TOOL_NAME,
  DB_CREATE_USER_TOOL_NAME,
  DB_DELETE_USER_TOOL_NAME,
  DB_GET_USER_TOOL_NAME,
  DB_LIST_USERS_TOOL_NAME,
  DB_UPDATE_USER_TOOL_NAME,
  SEND_MAIL_TOOL_NAME,
  WEB_SEARCH_TOOL_LEGACY_NAME,
  WEB_SEARCH_TOOL_NAME,
} from './tools/tool-names';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly modelWithTools: Runnable<BaseMessage[], AIMessage>;

  private summarizeToolResult(toolResult: unknown): string {
    const raw =
      typeof toolResult === 'string' ? toolResult : JSON.stringify(toolResult);
    return raw.length > 120 ? `${raw.slice(0, 120)}...` : raw;
  }

  constructor(
    @Inject('CHAT_MODEL') model: ChatOpenAI,
    @Inject(SEND_MAIL_TOOL)
    private readonly sendMailTool: DynamicTool<string>,
    @Inject(WEB_SEARCH_TOOL)
    private readonly webSearchTool: DynamicTool<string>,
    @Inject(CREATE_USER_TOOL)
    private readonly createUserTool: DynamicTool<string>,
    @Inject(LIST_USERS_TOOL)
    private readonly listUsersTool: DynamicTool<string>,
    @Inject(GET_USER_TOOL)
    private readonly getUserTool: DynamicTool<string>,
    @Inject(UPDATE_USER_TOOL)
    private readonly updateUserTool: DynamicTool<string>,
    @Inject(DELETE_USER_TOOL)
    private readonly deleteUserTool: DynamicTool<string>,
    @Inject(CRON_JOB_TOOL)
    private readonly cronJobTool: DynamicTool<string>,
  ) {
    this.modelWithTools = model.bindTools([
      this.sendMailTool,
      this.webSearchTool,
      this.createUserTool,
      this.listUsersTool,
      this.getUserTool,
      this.updateUserTool,
      this.deleteUserTool,
      this.cronJobTool,
    ]);

    this.logger.log(
      'AI tools chain initialized with sendMail/webSearch/db*/cronJob tools',
    );
  }

  private resolveTool(name: string): DynamicTool<string> | null {
    switch (name) {
      case SEND_MAIL_TOOL_NAME:
        return this.sendMailTool;
      case WEB_SEARCH_TOOL_NAME:
      case WEB_SEARCH_TOOL_LEGACY_NAME:
        return this.webSearchTool;
      case DB_CREATE_USER_TOOL_NAME:
        return this.createUserTool;
      case DB_LIST_USERS_TOOL_NAME:
        return this.listUsersTool;
      case DB_GET_USER_TOOL_NAME:
        return this.getUserTool;
      case DB_UPDATE_USER_TOOL_NAME:
        return this.updateUserTool;
      case DB_DELETE_USER_TOOL_NAME:
        return this.deleteUserTool;
      case CRON_JOB_TOOL_NAME:
        return this.cronJobTool;
      default:
        return null;
    }
  }

  async runAgentWithTools(question: string) {
    const start = Date.now();
    this.logger.log(`runAgentWithTools start question=${question}`);
    const messages: BaseMessage[] = [
      new SystemMessage(''),
      new HumanMessage(question),
    ];

    let round = 0;
    while (true) {
      round += 1;
      const response = await this.modelWithTools.invoke(messages);
      messages.push(response);

      if (!response.tool_calls?.length) {
        // 没有工具调用，说明模型已经给出最终回答
        this.logger.log(
          `runAgentWithTools finished in ${Date.now() - start}ms (round=${round})`,
        );
        return response.content;
      }
      this.logger.log(
        `runAgentWithTools round=${round} toolCalls=${response.tool_calls.length}`,
      );

      for (const toolCall of response.tool_calls) {
        const tool = this.resolveTool(toolCall.name);
        if (!tool) continue;
        const toolStart = Date.now();
        this.logger.log(
          `invoke tool=${toolCall.name} args=${JSON.stringify(toolCall.args)}`,
        );
        const toolResult = await tool.invoke(tool.schema.parse(toolCall.args));
        this.logger.log(
          `tool=${toolCall.name} done in ${Date.now() - toolStart}ms result=${this.summarizeToolResult(toolResult)}`,
        );
        messages.push(
          new ToolMessage({
            content: toolResult,
            name: toolCall.name,
            tool_call_id: toolCall.id!,
          }),
        );
      }
    }
  }

  async *streamAgentWithTools(question: string) {
    const start = Date.now();
    this.logger.log(`streamAgentWithTools start question=${question}`);
    const messages: BaseMessage[] = [
      new SystemMessage(
        `你是一个通用任务助手，可以根据用户的目标规划步骤，并在需要时调用工具：\`sendMail\` 发送邮件、\`webSearch\` 进行互联网搜索、\`dbCreateUser/dbListUsers/dbGetUser/dbUpdateUser/dbDeleteUser\` 读写数据库 users 表、\`cronJob\` 创建和管理定时/周期任务（\`list\`/\`add\`/\`toggle\`），从而实现提醒、定期任务、数据同步等各种自动化需求。

定时任务类型选择规则（非常重要）：
- 用户说“X分钟/小时/天后”“在某个时间点”“到点提醒”（一次性）=> 用 \`cronJob\` + \`type=at\`（执行一次后自动停用），\`at\`=当前时间+X 或解析出的时间点
- 用户说“每X分钟/每小时/每天”“定期/循环/一直”（重复执行）=> 用 \`cronJob\` + \`type=every\`（每次执行），\`everyMs\`=X换算成毫秒
- 用户给出 Cron 表达式或明确说“用 cron 表达式”（重复执行）=> 用 \`cronJob\` + \`type=cron\`

在调用 \`cronJob\`（action=add）创建任务时，需要把用户原始自然语言拆成两部分：一部分是“什么时候执行”（用来决定 type/at/everyMs/cron），另一部分是“要做什么任务本身”。\`instruction\` 字段只能填“要做什么”的那部分文本（保持原语言和原话），不能再改写、翻译或总结。

当用户请求“在未来某个时间点执行某个动作”（例如“1分钟后给我发一个笑话到邮箱”）时，本轮对话只需要使用 \`cronJob\` 设置/更新定时任务，不要在当前轮直接完成这个动作本身：不要直接调用 \`sendMail\` 给他发邮件，也不要在当前轮就真正“执行”指令，只需把要执行的动作写进 \`instruction\` 里，交给将来的定时任务去跑。

注意：像“\`1分钟后提醒我喝水\`”，时间相关信息用于计算下一次执行时间，而 \`instruction\` 应该是“提醒我喝水”；本轮不需要立刻提醒。`,
      ),
      new HumanMessage(question),
    ];

    let round = 0;
    while (true) {
      round += 1;
      const stream = await this.modelWithTools.stream(messages);
      let fullAIMessage: AIMessageChunk | null = null;
      for await (const chunk of stream as AsyncIterable<AIMessageChunk>) {
        fullAIMessage = fullAIMessage ? fullAIMessage.concat(chunk) : chunk;
        const hasToolCalls = fullAIMessage?.tool_call_chunks?.length ?? 0 > 0;
        // 只输出本轮新增的文本增量，避免重复输出累计内容。
        if (!hasToolCalls) {
          yield chunk.content;
        }
      }
      if (!fullAIMessage) {
        return;
      }
      const toolCalls = fullAIMessage.tool_calls ?? [];
      if (toolCalls.length === 0) {
        // 没有工具调用，说明模型已经给出最终回答
        this.logger.log(
          `streamAgentWithTools finished in ${Date.now() - start}ms (round=${round})`,
        );
        return;
      }
      this.logger.log(
        `streamAgentWithTools round=${round} toolCalls=${toolCalls.length}`,
      );
      for (const toolCall of toolCalls) {
        const tool = this.resolveTool(toolCall.name);
        if (!tool) continue;
        const toolStart = Date.now();
        this.logger.log(
          `invoke tool=${toolCall.name} args=${JSON.stringify(toolCall.args)}`,
        );
        const toolResult = await tool.invoke(tool.schema.parse(toolCall.args));
        this.logger.log(
          `tool=${toolCall.name} done in ${Date.now() - toolStart}ms result=${this.summarizeToolResult(toolResult)}`,
        );
        messages.push(
          new ToolMessage({
            content: toolResult,
            tool_call_id: toolCall.id!,
            name: toolCall.name,
          }),
        );
      }
    }
  }
}

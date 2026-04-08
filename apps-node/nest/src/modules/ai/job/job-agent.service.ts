import { ChatOpenAI } from '@langchain/openai';
import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  CREATE_USER_TOOL,
  DELETE_USER_TOOL,
  GET_USER_TOOL,
  LIST_USERS_TOOL,
  SEND_MAIL_TOOL,
  TIME_NOW_TOOL,
  UPDATE_USER_TOOL,
  WEB_SEARCH_TOOL,
} from '../tools/tokens';
import { DynamicTool } from '@langchain/core/tools';
import { Runnable } from '@langchain/core/runnables';
import {
  AIMessage,
  BaseMessage,
  HumanMessage,
  SystemMessage,
  ToolMessage,
} from '@langchain/core/messages';
import {
  DB_CREATE_USER_TOOL_NAME,
  DB_DELETE_USER_TOOL_NAME,
  DB_GET_USER_TOOL_NAME,
  DB_LIST_USERS_TOOL_NAME,
  DB_UPDATE_USER_TOOL_NAME,
  SEND_MAIL_TOOL_NAME,
  WEB_SEARCH_TOOL_LEGACY_NAME,
  WEB_SEARCH_TOOL_NAME,
} from '../tools/tool-names';

@Injectable()
export class JobAgentService {
  private readonly logger = new Logger(JobAgentService.name);
  private readonly chatModelWithTools: Runnable<BaseMessage[], AIMessage>;
  constructor(
    @Inject('CHAT_MODEL')
    private readonly chatModel: ChatOpenAI,
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
    @Inject(TIME_NOW_TOOL)
    private readonly timeNowTool: DynamicTool<string>,
  ) {
    this.chatModelWithTools = this.chatModel.bindTools([
      this.sendMailTool,
      this.webSearchTool,
      this.createUserTool,
      this.listUsersTool,
      this.getUserTool,
      this.updateUserTool,
      this.deleteUserTool,
      this.timeNowTool,
    ]);
    this.logger.log('JobAgentService initialized');
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
      default:
        return null;
    }
  }

  async runJob(instruction: string) {
    const messages: BaseMessage[] = [
      new SystemMessage(
        '你是一个任务助手，可以根据用户的目标规划步骤，并在需要时调用工具：sendMail 发送邮件、webSearch 进行互联网搜索、dbCreateUser/dbListUsers/dbGetUser/dbUpdateUser/dbDeleteUser 读写数据库 users 表、cronJob 创建和管理定时/周期任务（list/add/toggle），从而实现提醒、定期任务、数据同步等各种自动化需求。',
      ),
      new HumanMessage(instruction),
    ];
    while (true) {
      const start = Date.now();
      const response = await this.chatModelWithTools.invoke(messages);
      messages.push(response);
      if (!response.tool_calls?.length) {
        this.logger.log(
          `runJob finished in ${Date.now() - start}ms, response=${response.content as string}`,
        );
        return response.content as string;
      }
      for (const toolCall of response.tool_calls) {
        const tool = this.resolveTool(toolCall.name);
        if (!tool) continue;
        this.logger.log(
          `invoke tool=${toolCall.name} args=${JSON.stringify(toolCall.args)}`,
        );
        const toolResult = await tool.invoke(tool.schema.parse(toolCall.args));
        this.logger.log(
          `tool=${toolCall.name} done in ${Date.now() - start}ms, result=${toolResult}`,
        );
        messages.push(
          new ToolMessage({
            content: toolResult,
            tool_call_id: toolCall.id!,
          }),
        );
      }
    }
  }
}

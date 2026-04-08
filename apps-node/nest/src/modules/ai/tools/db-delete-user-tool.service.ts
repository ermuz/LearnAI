import { Injectable } from '@nestjs/common';
import { tool } from '@langchain/core/tools';
import z from 'zod';
import { UsersService } from '../../users/users.service';
import { DB_DELETE_USER_TOOL_NAME } from './tool-names';
import { BaseToolService } from './base-tool.service';

@Injectable()
export class DbDeleteUserToolService extends BaseToolService {
  constructor(private readonly usersService: UsersService) {
    super();
  }

  create() {
    const schema = z.object({
      id: z.number().int().positive().describe('用户 ID'),
    });
    return tool(
      async ({ id }) => {
        try {
          await this.usersService.remove(id);
          return `用户 ID ${id} 已删除。`;
        } catch {
          return `未找到 ID 为 ${id} 的用户，无法删除。`;
        }
      },
      {
        name: DB_DELETE_USER_TOOL_NAME,
        description: '删除数据库用户',
        schema,
      },
    );
  }
}

import { Injectable } from '@nestjs/common';
import { tool } from '@langchain/core/tools';
import z from 'zod';
import { UsersService } from '../../users/users.service';
import { DB_GET_USER_TOOL_NAME } from './tool-names';
import { BaseToolService } from './base-tool.service';

@Injectable()
export class DbGetUserToolService extends BaseToolService {
  constructor(private readonly usersService: UsersService) {
    super();
  }

  create() {
    const schema = z.object({
      id: z.number().int().positive().describe('用户 ID'),
    });
    return tool(
      async ({ id }) => {
        const user = await this.usersService.findOne(id);
        if (!user) return `未找到 ID 为 ${id} 的用户。`;
        return `用户信息：ID: ${user.id}, Name: ${user.name}, Email: ${user.email}`;
      },
      {
        name: DB_GET_USER_TOOL_NAME,
        description: '根据 ID 查询数据库用户',
        schema,
      },
    );
  }
}

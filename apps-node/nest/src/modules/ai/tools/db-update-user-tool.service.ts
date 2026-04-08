import { Injectable } from '@nestjs/common';
import { tool } from '@langchain/core/tools';
import z from 'zod';
import { UsersService } from '../../users/users.service';
import { DB_UPDATE_USER_TOOL_NAME } from './tool-names';
import { BaseToolService } from './base-tool.service';

@Injectable()
export class DbUpdateUserToolService extends BaseToolService {
  constructor(private readonly usersService: UsersService) {
    super();
  }

  create() {
    const schema = z.object({
      id: z.number().int().positive().describe('用户 ID'),
      name: z.string().min(1).max(50).optional(),
      email: z.string().email().max(50).optional(),
    });
    return tool(
      async ({ id, name, email }) => {
        if (!name && !email) {
          return '更新用户需要提供至少一个字段（name 或 email）。';
        }
        try {
          const user = await this.usersService.update(id, { name, email });
          return `用户已更新：ID: ${user.id}, Name: ${user.name}, Email: ${user.email}`;
        } catch {
          return `未找到 ID 为 ${id} 的用户，无法更新。`;
        }
      },
      {
        name: DB_UPDATE_USER_TOOL_NAME,
        description: '更新数据库用户信息',
        schema,
      },
    );
  }
}

import { Injectable } from '@nestjs/common';
import { tool } from '@langchain/core/tools';
import z from 'zod';
import { UsersService } from '../../users/users.service';
import { DB_CREATE_USER_TOOL_NAME } from './tool-names';
import { BaseToolService } from './base-tool.service';

@Injectable()
export class DbCreateUserToolService extends BaseToolService {
  constructor(private readonly usersService: UsersService) {
    super();
  }

  create() {
    const schema = z.object({
      name: z.string().min(1).max(50).describe('用户姓名'),
      email: z.string().email().max(50).describe('用户邮箱'),
    });

    return tool(
      async ({ name, email }) => {
        const newUser = await this.usersService.create({ name, email });
        return `用户已创建：ID ${newUser.id}, Name: ${newUser.name}, Email: ${newUser.email}`;
      },
      { name: DB_CREATE_USER_TOOL_NAME, description: '创建数据库用户', schema },
    );
  }
}

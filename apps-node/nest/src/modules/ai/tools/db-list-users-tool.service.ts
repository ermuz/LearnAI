import { Injectable } from '@nestjs/common';
import { tool } from '@langchain/core/tools';
import z from 'zod';
import { UsersService } from '../../users/users.service';
import { DB_LIST_USERS_TOOL_NAME } from './tool-names';
import { BaseToolService } from './base-tool.service';

@Injectable()
export class DbListUsersToolService extends BaseToolService {
  constructor(private readonly usersService: UsersService) {
    super();
  }

  create() {
    const schema = z.object({});
    return tool(
      async () => {
        const users = await this.usersService.findAll();
        if (users.length === 0) return '没有用户。';
        return users
          .map((u) => `ID: ${u.id}, Name: ${u.name}, Email: ${u.email}`)
          .join('\n');
      },
      {
        name: DB_LIST_USERS_TOOL_NAME,
        description: '查询所有数据库用户',
        schema,
      },
    );
  }
}

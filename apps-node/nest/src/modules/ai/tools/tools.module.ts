import { forwardRef, Module } from '@nestjs/common';
import { UsersModule } from '../../users/users.module';
import { JobModule } from '../job/job.module';
import {
  CREATE_USER_TOOL,
  CRON_JOB_TOOL,
  DELETE_USER_TOOL,
  GET_USER_TOOL,
  LIST_USERS_TOOL,
  SEND_MAIL_TOOL,
  TIME_NOW_TOOL,
  UPDATE_USER_TOOL,
  WEB_SEARCH_TOOL,
} from './tokens';
import { SendMailToolService } from './send-mail-tool.service';
import { WebSearchToolService } from './web-search-tool.service';
import { DbCreateUserToolService } from './db-create-user-tool.service';
import { DbListUsersToolService } from './db-list-users-tool.service';
import { DbGetUserToolService } from './db-get-user-tool.service';
import { DbUpdateUserToolService } from './db-update-user-tool.service';
import { DbDeleteUserToolService } from './db-delete-user-tool.service';
import { CronJobToolService } from './cron-job-tool.service';
import { TimeNowToolService } from './time-now-tool.service';

@Module({
  imports: [UsersModule, forwardRef(() => JobModule)],
  providers: [
    SendMailToolService,
    WebSearchToolService,
    DbCreateUserToolService,
    DbListUsersToolService,
    DbGetUserToolService,
    DbUpdateUserToolService,
    DbDeleteUserToolService,
    CronJobToolService,
    TimeNowToolService,
    {
      provide: SEND_MAIL_TOOL,
      useFactory: (svc: SendMailToolService) => svc.create(),
      inject: [SendMailToolService],
    },
    {
      provide: WEB_SEARCH_TOOL,
      useFactory: (svc: WebSearchToolService) => svc.create(),
      inject: [WebSearchToolService],
    },
    {
      provide: CREATE_USER_TOOL,
      useFactory: (svc: DbCreateUserToolService) => svc.create(),
      inject: [DbCreateUserToolService],
    },
    {
      provide: LIST_USERS_TOOL,
      useFactory: (svc: DbListUsersToolService) => svc.create(),
      inject: [DbListUsersToolService],
    },
    {
      provide: GET_USER_TOOL,
      useFactory: (svc: DbGetUserToolService) => svc.create(),
      inject: [DbGetUserToolService],
    },
    {
      provide: UPDATE_USER_TOOL,
      useFactory: (svc: DbUpdateUserToolService) => svc.create(),
      inject: [DbUpdateUserToolService],
    },
    {
      provide: DELETE_USER_TOOL,
      useFactory: (svc: DbDeleteUserToolService) => svc.create(),
      inject: [DbDeleteUserToolService],
    },
    {
      provide: CRON_JOB_TOOL,
      useFactory: (svc: CronJobToolService) => svc.create(),
      inject: [CronJobToolService],
    },
    {
      provide: TIME_NOW_TOOL,
      useFactory: (svc: TimeNowToolService) => svc.create(),
      inject: [TimeNowToolService],
    },
  ],
  exports: [
    SEND_MAIL_TOOL,
    WEB_SEARCH_TOOL,
    CREATE_USER_TOOL,
    LIST_USERS_TOOL,
    GET_USER_TOOL,
    UPDATE_USER_TOOL,
    DELETE_USER_TOOL,
    CRON_JOB_TOOL,
    TIME_NOW_TOOL,
  ],
})
export class ToolsModule {}

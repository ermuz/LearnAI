import { forwardRef, Module } from '@nestjs/common';
import { JobService } from './job.service';
import { JobAgentService } from './job-agent.service';
import { ToolsModule } from '../tools/tools.module';

@Module({
  imports: [forwardRef(() => ToolsModule)],
  providers: [JobService, JobAgentService],
  exports: [JobService],
})
export class JobModule {}

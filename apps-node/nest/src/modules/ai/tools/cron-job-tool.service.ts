import { Injectable } from '@nestjs/common';
import { tool } from '@langchain/core/tools';
import z from 'zod';
import { JobService } from '../job/job.service';
import { CRON_JOB_TOOL_NAME } from './tool-names';
import { BaseToolService } from './base-tool.service';

@Injectable()
export class CronJobToolService extends BaseToolService {
  constructor(private readonly jobService: JobService) {
    super();
  }

  create() {
    type JobListItem = Awaited<ReturnType<JobService['listJobs']>>[number];
    const formatJob = (job: JobListItem): string => {
      const atValue =
        job.at instanceof Date ? job.at.toISOString() : (job.at ?? '');
      return `id=${job.id} type=${job.type} enabled=${job.isEnabled} running=${job.running} cron=${job.cron ?? ''} everyMs=${job.everyMs ?? ''} at=${atValue} instruction=${job.instruction ?? ''}`;
    };

    const schema = z.object({
      action: z
        .enum(['list', 'add', 'toggle'])
        .describe('要执行的操作：list、add、toggle'),
      id: z.string().optional().describe('任务 ID（toggle 时需要）'),
      enabled: z
        .boolean()
        .optional()
        .describe('是否启用（toggle 可选；不传则自动取反）'),
      type: z
        .enum(['cron', 'every', 'at'])
        .optional()
        .describe('任务类型（add 时需要）'),
      instruction: z
        .string()
        .optional()
        .describe('任务说明/指令（add 时需要）'),
      cron: z
        .string()
        .optional()
        .describe('Cron 表达式（type=cron 时需要，例如 */5 * * * * *）'),
      everyMs: z
        .number()
        .int()
        .positive()
        .optional()
        .describe('固定间隔毫秒（type=every 时需要）'),
      at: z
        .string()
        .optional()
        .describe('指定触发时间点（type=at 时需要，ISO 字符串）'),
    });

    return tool(
      async ({
        action,
        id,
        enabled,
        type,
        instruction,
        cron,
        everyMs,
        at,
      }: {
        action: 'list' | 'add' | 'toggle';
        id?: string;
        enabled?: boolean;
        type?: 'cron' | 'every' | 'at';
        instruction?: string;
        cron?: string;
        everyMs?: number;
        at?: string;
      }) => {
        switch (action) {
          case 'list': {
            const jobs = await this.jobService.listJobs();
            if (!jobs.length) return '当前没有任何定时任务。';
            return `当前定时任务列表：\n${jobs.map(formatJob).join('\n')}`;
          }
          case 'add': {
            if (!type) return '新增任务需要提供 type（cron/every/at）。';
            const normalizedInstruction = instruction?.trim();
            if (!normalizedInstruction) return '新增任务需要提供 instruction。';

            if (type === 'cron') {
              const normalizedCron = cron?.trim();
              if (!normalizedCron) return 'type=cron 时需要提供 cron。';
              const created = await this.jobService.addJob({
                type,
                instruction: normalizedInstruction,
                cron: normalizedCron,
                isEnabled: true,
              });
              return `已新增定时任务：id=${created.id} type=cron cron=${created.cron ?? ''} enabled=${created.isEnabled}`;
            }
            if (type === 'every') {
              if (typeof everyMs !== 'number' || everyMs <= 0) {
                return 'type=every 时需要提供 everyMs（正整数，单位毫秒）。';
              }
              const created = await this.jobService.addJob({
                type,
                instruction: normalizedInstruction,
                everyMs,
                isEnabled: true,
              });
              return `已新增定时任务：id=${created.id} type=every everyMs=${created.everyMs ?? ''} enabled=${created.isEnabled}`;
            }

            const normalizedAt = at?.trim();
            if (!normalizedAt) {
              return 'type=at 时需要提供 at（ISO 时间字符串）。';
            }
            const date = new Date(normalizedAt);
            if (Number.isNaN(date.getTime())) {
              return 'type=at 的 at 不是合法的 ISO 时间字符串。';
            }
            const created = await this.jobService.addJob({
              type: 'at',
              instruction: normalizedInstruction,
              at: date,
              isEnabled: true,
            });
            return `已新增定时任务：id=${created.id} type=at at=${created.at instanceof Date ? created.at.toISOString() : ''} enabled=${created.isEnabled}`;
          }
          case 'toggle': {
            if (!id) return 'toggle 任务需要提供 id。';
            const updated = await this.jobService.toggleJob(id, enabled);
            return `已更新任务状态：id=${updated.id} enabled=${updated.isEnabled}`;
          }
        }
      },
      {
        name: CRON_JOB_TOOL_NAME,
        description: '管理服务端定时任务（支持 list/add/toggle）。',
        schema,
      },
    );
  }
}

import {
  Injectable,
  Logger,
  NotFoundException,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SchedulerRegistry } from '@nestjs/schedule';
import type { Job } from '@prisma/client';
import { CronJob } from 'cron';
import { JobAgentService } from './job-agent.service';

@Injectable()
export class JobService implements OnApplicationBootstrap {
  private readonly logger = new Logger(JobService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly jobAgentService: JobAgentService,
  ) {}
  async onApplicationBootstrap() {
    const jobs = await this.prisma.job.findMany({
      where: { isEnabled: true },
    });
    const cronJobs = this.schedulerRegistry.getCronJobs();
    const intervals = this.schedulerRegistry.getIntervals();
    const timeouts = this.schedulerRegistry.getTimeouts();

    for (const job of jobs) {
      const alreadyRegistered =
        (job.type === 'cron' && cronJobs.has(job.id)) ||
        (job.type === 'every' && intervals.includes(job.id)) ||
        (job.type === 'at' && timeouts.includes(job.id));
      if (alreadyRegistered) continue;

      this.startRuntime(job);
    }
  }

  async listJobs() {
    const jobs = await this.prisma.job.findMany();
    const cronJobs = this.schedulerRegistry.getCronJobs();
    const intervals = this.schedulerRegistry.getIntervals();
    const timeouts = this.schedulerRegistry.getTimeouts();

    return jobs.map((job) => ({
      ...job,
      running:
        (job.type === 'cron' && cronJobs.has(job.id)) ||
        (job.type === 'every' && intervals.includes(job.id)) ||
        (job.type === 'at' && timeouts.includes(job.id)),
    }));
  }

  async addJob(
    input:
      | {
          type: 'cron';
          instruction: string;
          cron: string;
          isEnabled?: boolean;
        }
      | {
          type: 'every';
          instruction: string;
          everyMs: number;
          isEnabled?: boolean;
        }
      | {
          type: 'at';
          instruction: string;
          at: Date;
          isEnabled?: boolean;
        },
  ) {
    const job = await this.prisma.job.create({
      data: {
        instruction: input.instruction,
        type: input.type,
        cron: input.type === 'cron' ? input.cron : null,
        everyMs: input.type === 'every' ? input.everyMs : null,
        at: input.type === 'at' ? input.at : null,
        isEnabled: input.isEnabled ?? true,
        lastRun: null,
      },
    });
    if (job.isEnabled) {
      this.startRuntime(job);
    }
    return job;
  }

  async toggleJob(jobId: string, enabled?: boolean) {
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException(`Job not found: ${jobId}`);

    const nextEnabled = enabled ?? !job.isEnabled;
    if (job.isEnabled !== nextEnabled) {
      job.isEnabled = nextEnabled;
      await this.prisma.job.update({
        where: { id: jobId },
        data: { isEnabled: nextEnabled },
      });
    }

    if (job.isEnabled) {
      this.startRuntime(job);
    } else {
      this.stopRuntime(job);
    }

    return job;
  }
  startRuntime(job: Job): void {
    switch (job.type) {
      case 'cron': {
        if (this.schedulerRegistry.doesExist('cron', job.id)) {
          this.schedulerRegistry.getCronJob(job.id).start();
          return;
        }
        this.registerCronJob(job);
        return;
      }
      case 'every': {
        this.registerIntervalJob(job);
        return;
      }
      case 'at': {
        this.registerTimeoutJob(job);
        return;
      }
    }
  }

  private registerIntervalJob(job: Job) {
    const intervals = this.schedulerRegistry.getIntervals();
    if (intervals.includes(job.id)) return;
    if (typeof job.everyMs !== 'number' || job.everyMs <= 0) {
      throw new Error(`Invalid everyMs for job ${job.id}`);
    }

    const ref = setInterval(() => {
      this.logger.log(`run job ${job.id}, ${job.instruction}`);
      void this.jobAgentService
        .runJob(job.instruction)
        .then((response) => {
          this.logger.log(
            `run job ${job.id}, ${job.instruction} response=${response}`,
          );
        })
        .then(() => this.touchJob(job.id))
        .catch((error: unknown) => {
          this.logger.error(
            `failed to run/update job ${job.id}: ${(error as Error).message}`,
          );
        });
    }, job.everyMs);

    this.schedulerRegistry.addInterval(job.id, ref);
  }

  private registerTimeoutJob(job: Job): void {
    const names = this.schedulerRegistry.getTimeouts();
    if (names.includes(job.id)) return;
    if (!job.at) {
      throw new Error(`Invalid at for job ${job.id}`);
    }

    const delay = Math.max(0, job.at.getTime() - Date.now());
    const ref = setTimeout(() => {
      this.logger.log(`run job ${job.id}, ${job.instruction}`);
      void this.jobAgentService
        .runJob(job.instruction)
        .then((response) => {
          this.logger.log(
            `run job ${job.id}, ${job.instruction} response=${response}`,
          );
        })
        .then(() => this.touchJob(job.id, { isEnabled: false }))
        .catch((error: unknown) => {
          this.logger.error(
            `failed to run/update job ${job.id}: ${(error as Error).message}`,
          );
        })
        .finally(() => {
          this.schedulerRegistry.deleteTimeout(job.id);
        });
    }, delay);

    this.schedulerRegistry.addTimeout(job.id, ref);
  }

  private registerCronJob(job: Job): void {
    const cronExpr = job.cron ?? '';
    const cronJob = CronJob.from({
      cronTime: cronExpr,
      onTick: async () => {
        this.logger.log(`run job ${job.id}, ${job.instruction}`);
        const response = await this.jobAgentService.runJob(job.instruction);
        this.logger.log(
          `run job ${job.id}, ${job.instruction} response=${response}`,
        );
        await this.touchJob(job.id);
      },
    });
    this.schedulerRegistry.addCronJob(job.id, cronJob);
    cronJob.start();
  }

  private stopRuntime(job: Job) {
    if (job.type === 'cron') {
      const cronJobs = this.schedulerRegistry.getCronJobs();
      const runtimeJob = cronJobs.get(job.id);
      if (runtimeJob) {
        void runtimeJob.stop();
      }
      return;
    }

    if (job.type === 'every') {
      try {
        this.schedulerRegistry.deleteInterval(job.id);
      } catch {
        // ignore
      }
      return;
    }

    if (job.type === 'at') {
      try {
        this.schedulerRegistry.deleteTimeout(job.id);
      } catch {
        // ignore
      }
      return;
    }
  }

  private async touchJob(id: string, extraData?: Pick<Job, 'isEnabled'>) {
    await this.prisma.job.update({
      where: { id },
      data: { lastRun: new Date(), ...extraData },
    });
  }
}

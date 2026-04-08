import { OmitType, PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export enum JobType {
  cron = 'cron',
  every = 'every',
  at = 'at',
}

export class JobDto {
  @IsUUID()
  id!: string;

  @IsString()
  instruction!: string;

  @IsEnum(JobType)
  type!: JobType;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  cron!: string | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  everyMs!: number | null;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  at!: Date | null;

  @IsBoolean()
  isEnabled!: boolean;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  lastRun!: Date | null;

  @Type(() => Date)
  @IsDate()
  createdAt!: Date;

  @Type(() => Date)
  @IsDate()
  updatedAt!: Date;
}

export class CreateJobDto extends OmitType(JobDto, [
  'id',
  'createdAt',
  'updatedAt',
  'lastRun',
] as const) {}

export class UpdateJobDto extends PartialType(CreateJobDto) {}

import { OmitType, PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';

export class UserDto {
  @IsInt()
  id!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50, { message: '姓名长度不能超过50个字符' })
  name!: string;

  @IsEmail({}, { message: '邮箱格式不正确' })
  @IsNotEmpty()
  @MaxLength(50, { message: '邮箱长度不能超过50个字符' })
  email!: string;

  @Type(() => Date)
  @IsDate()
  createdAt!: Date;

  @Type(() => Date)
  @IsDate()
  updatedAt!: Date;
}

// 创建时不允许客户端传 id/createdAt/updatedAt，数据库自动生成
export class CreateUserDto extends OmitType(UserDto, [
  'id',
  'createdAt',
  'updatedAt',
] as const) {}

// 更新时仅允许可更新字段，且全部可选
export class UpdateUserDto extends PartialType(CreateUserDto) {}

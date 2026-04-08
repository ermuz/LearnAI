import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('create')
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get('getAll')
  getAll() {
    return this.usersService.findAll();
  }

  @Get('query')
  query(@Query('id') id: number) {
    return this.usersService.findOne(id);
  }

  @Post('update')
  update(@Body('id') id: number, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Post('delete')
  delete(@Body('id') id: number) {
    return this.usersService.remove(id);
  }
}

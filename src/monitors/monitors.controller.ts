import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { MonitorsService } from './monitors.service';
import { CreateMonitorDto } from './dto/create-monitor.dto';
import { UpdateMonitorDto } from './dto/update-monitor.dto';

@Controller('monitors')
export class MonitorsController {
  constructor(private readonly monitorsService: MonitorsService) {}

  @Post()
  create(@Body() createMonitorDto: CreateMonitorDto) {
    return this.monitorsService.create(createMonitorDto);
  }

  @Get()
  findAll() {
    return this.monitorsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.monitorsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMonitorDto: UpdateMonitorDto) {
    return this.monitorsService.update(+id, updateMonitorDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.monitorsService.remove(+id);
  }
}

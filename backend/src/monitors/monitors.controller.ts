import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe } from '@nestjs/common';
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

  @Get('stats')
  getStats() {
    return this.monitorsService.getGlobalStats();
  }

  @Get('incidents')
  getIncidents(@Query('monitorId') monitorId?: string) {
    return this.monitorsService.getIncidents(monitorId ? parseInt(monitorId, 10) : undefined);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.monitorsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateMonitorDto: UpdateMonitorDto) {
    return this.monitorsService.update(id, updateMonitorDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.monitorsService.remove(id);
  }

  @Get(':id/checks')
  getChecks(@Param('id', ParseIntPipe) id: number, @Query('limit') limit?: string) {
    const parsedLimit = limit ? parseInt(limit, 10) : 50;
    return this.monitorsService.getChecks(id, parsedLimit);
  }

  @Post(':id/check')
  runCheck(@Param('id', ParseIntPipe) id: number) {
    return this.monitorsService.runCheck(id);
  }
}

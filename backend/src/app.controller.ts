import { Controller, Get, Query } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('system/diagnostics')
  getDiagnostics(@Query('signature') signature?: string) {
    return this.appService.getDiagnostics(signature);
  }
}
import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { SlackService } from './slack/slack.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService, private readonly slackService: SlackService) {}

  @Get()
  getServerState(): string {
    this.slackService.postMessage('test');
    return this.appService.checkServer();
  }
}

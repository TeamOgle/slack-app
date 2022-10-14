import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { SlackService } from './slack.service';
import type { SlackShortCutDto } from './dtos/slack-short-cut.dto';

@Controller('slack')
export class SlackController {
  constructor(private readonly slackService: SlackService) {}

  @HttpCode(HttpStatus.OK)
  @Post('events')
  async callModal(@Body() slackShortCutDto: SlackShortCutDto) {
    let interactionResult = true;
    const payload = slackShortCutDto.payload;

    if (payload.type === 'shortcut') {
      interactionResult = await this.slackService.callModal(payload.trigger_id);
    } else if (payload.type === 'view_submission') {
      interactionResult = await this.slackService.getModalValues(payload);
    }

    if (!interactionResult) {
      throw new Error('slack app error');
    }
  }

  @HttpCode(HttpStatus.OK)
  @Post('action-point')
  subscribeEvent(@Body() body) {
    return { challenge: body.challenge };
  }

  @HttpCode(HttpStatus.OK)
  @Get('auth')
  auth(@Query('code') code) {
    return this.slackService.accessWorkspace(code);
  }
}

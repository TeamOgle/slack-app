import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query, Req, Res } from '@nestjs/common';
import { SlackService } from './slack.service';
import type { SlackShortCutDto, SlackEventDto } from './dtos';
import type { ShortCutPayload, InteractionPayload } from './interfaces';

@Controller('slack')
export class SlackController {
  constructor(private readonly slackService: SlackService) {}

  @HttpCode(HttpStatus.OK)
  @Post('events')
  async callModal(@Req() req, @Res() res): Promise<void> {
    const slackShortCutDto: SlackShortCutDto = req.body;
    const payload: ShortCutPayload | InteractionPayload = JSON.parse(slackShortCutDto.payload);

    if (payload.type === 'shortcut') {
      await this.slackService.callModal(payload.team.id, payload.trigger_id);
    } else if (payload.type === 'view_submission') {
      await this.slackService.sendLink(payload);
    }

    return res.json();
  }

  @HttpCode(HttpStatus.OK)
  @Post('action-point')
  subscribeEvent(@Body() body: SlackEventDto) {
    console.log(body);
    return { challenge: body.challenge };
  }

  @HttpCode(HttpStatus.OK)
  @Get('auth')
  auth(@Query('code') code) {
    return this.slackService.accessWorkspace(code);
  }
}

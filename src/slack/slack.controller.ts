import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query, Req, Res } from '@nestjs/common';
import { SlackService } from './slack.service';
import type { SlackShortCutDto, SlackEventDto, SlackCommandDto } from './dtos';
import type { ShortCutPayload, InteractionPayload } from './interfaces';

@Controller('slack')
export class SlackController {
  constructor(private readonly slackService: SlackService) {}

  @HttpCode(HttpStatus.OK)
  @Post('events')
  async callModal(@Req() req, @Res() res) {
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
  subscribeEvent(@Body() slackEventDto: SlackEventDto) {
    console.log(slackEventDto);
    return { challenge: slackEventDto.challenge };
  }

  @HttpCode(HttpStatus.OK)
  @Get('auth')
  auth(@Query('code') code) {
    return this.slackService.accessWorkspace(code);
  }

  @HttpCode(HttpStatus.OK)
  @Post('links/sharing')
  getSharingLinks(@Body() body: SlackCommandDto) {
    return this.slackService.getSharingLinks(body.user_id);
  }

  @HttpCode(HttpStatus.OK)
  @Post('links/shared')
  getSharedLinks(@Body() body: SlackCommandDto) {
    return this.slackService.getSharedLinks(body.user_id);
  }
}

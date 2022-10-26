import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { SlackService } from './slack.service';
import type {
  SlackShortCutDto,
  SlackEventDto,
  SlackCommandDto,
  SlackVerificationEventDto,
} from './dtos';
import type { ShortCutPayload, BlockActionPayload, InteractionPayload } from './interfaces';

@Controller('slack')
export class SlackController {
  constructor(private readonly slackService: SlackService) {}

  @HttpCode(HttpStatus.OK)
  @Post('events')
  async callModal(@Req() req, @Res() res) {
    const slackShortCutDto: SlackShortCutDto = req.body;
    const payload: ShortCutPayload | BlockActionPayload | InteractionPayload = JSON.parse(
      slackShortCutDto.payload,
    );

    switch (payload.type) {
      case 'shortcut':
        await this.slackService.callModal(payload.team.id, payload.trigger_id);
        break;
      case 'block_actions':
        await this.slackService.updateModal(payload);
        break;
      case 'view_submission':
        await this.slackService.sendLink(payload);
        break;
      default:
        throw new BadRequestException('invalid event');
    }

    return res.json();
  }

  @HttpCode(HttpStatus.OK)
  @Post('action-point')
  subscribeEvent(@Body() slackEventDto: SlackVerificationEventDto | SlackEventDto) {
    const isEvent = slackEventDto.type === 'event_callback';
    if (isEvent) {
      switch (slackEventDto.event.type) {
        case 'team_join':
          this.slackService.saveNewSlackUser(slackEventDto);
          break;
      }
    }
    return { challenge: isEvent ? slackEventDto.event.type : slackEventDto.challenge };
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

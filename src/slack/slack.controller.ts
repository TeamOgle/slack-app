import { Controller, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { SlackService } from './slack.service';

@Controller('slack')
export class SlackController {
  constructor(private readonly slackService: SlackService) {}

  @Post('events')
  async callModal(@Req() request, @Res() response) {
    try {
      let interactionResult = true;

      const payload = await JSON.parse(request.body.payload)
      const { type, trigger_id } = payload

      const interaction = {
        type,
        access: 'success',
      };
      console.log(interaction);

      if (type === 'shortcut') {
        interactionResult = await this.slackService.callModal(trigger_id);
      } else if (type === 'view_submission') {
        interactionResult = await this.slackService.getModalValues(payload);
      }

      if (interactionResult) {
        // 매 요청마다 HTTP status 200을 전달해야 하며 response에 아무것도 담겨있으면 안 됨
        return response.status(200).json();
      } else {
        throw new Error('app error');
      }
    } catch (err) {
      console.log('err', err);
    }
  }
}

import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { WebClient } from '@slack/web-api';
import { map } from 'rxjs';
import slackConfig from 'src/config/slack.config';

@Injectable()
export class SlackService {
  private slack: WebClient;

  constructor(@Inject(slackConfig.KEY) private config: ConfigType<typeof slackConfig>) {
    this.slack = new WebClient(config.token);
  }

  async postMessage(text: string) {
    // const channelIds = await this.slack.conversations.list({
    //   types: 'public_channel,private_channel',
    // });
    const results = await this.slack.users.list();
    console.log(results.members.filter((member) => !member.deleted && !member.is_bot));
    // await this.slack.chat.postMessage({ text, channel: 'C01HTKY3QUV' });

    return 'success';
  }
}

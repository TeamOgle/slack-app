import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { WebClient } from '@slack/web-api';
import slackConfig from 'src/config/slack.config';

@Injectable()
export class SlackService {
  private slack: WebClient;
  private readonly SELECTED_CHANNEL_ACTION_ID = 'selected_conversation';
  private readonly SELECTED_USERS_ACTION_ID = 'selected_users';

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

  async callModal(trigger_id) {
    const result = await this.slack.views.open({
      trigger_id,
      view: {
        type: 'modal',
        title: {
          type: 'plain_text',
          text: 'Zettel',
          emoji: true,
        },
        submit: {
          type: 'plain_text',
          text: 'Submit',
          emoji: true,
        },
        close: {
          type: 'plain_text',
          text: 'Close',
        },
        callback_id: 'call_modal',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '*채널*',
            },
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'conversations_select',
                placeholder: {
                  type: 'plain_text',
                  text: 'Select channel',
                  emoji: true,
                },
                filter: {
                  include: ['private'],
                },
                action_id: this.SELECTED_CHANNEL_ACTION_ID,
              },
            ],
          },
          {
            type: 'input',
            element: {
              type: 'multi_users_select',
              placeholder: {
                type: 'plain_text',
                text: 'Select companions',
                emoji: true,
              },
              action_id: this.SELECTED_USERS_ACTION_ID,
            },
            label: {
              type: 'plain_text',
              text: '동료',
              emoji: true,
            },
          },
          {
            type: 'divider',
          },
          {
            type: 'input',
            element: {
              type: 'plain_text_input',
              action_id: 'link',
            },
            label: {
              type: 'plain_text',
              text: '링크',
              emoji: true,
            },
          },
          {
            type: 'input',
            element: {
              type: 'plain_text_input',
              multiline: true,
              action_id: 'contents',
            },
            label: {
              type: 'plain_text',
              text: '내용',
              emoji: true,
            },
          },
        ],
      },
    });

    return result ? true : false;
  }

  async getModalValues(payload) {
    const blocks = Object.values(payload.view.state.values);

    const values = new Map();
    for (let i = 0; i < blocks.length; i++) {
      const [[key, value]] = Object.entries(blocks[i]);
      values.set(key, value);
    }

    const { user } = payload;
    const channel = values.get(this.SELECTED_CHANNEL_ACTION_ID)[this.SELECTED_CHANNEL_ACTION_ID];
    const receiveUsers = values.get(this.SELECTED_USERS_ACTION_ID)[this.SELECTED_USERS_ACTION_ID];
    const link = values.get('link').value;
    const content = values.get('contents').value;

    const data = { user, channel, receiveUsers, link, content };
    console.log('data', data);

    return data ? true : false;
  }
}

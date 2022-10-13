import { HttpException, Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import type { ModalView, Block, KnownBlock, MessageAttachment } from '@slack/web-api';
import { WebClient } from '@slack/web-api';
import slackConfig from 'src/config/slack.config';
import type { InteractionPayload } from './dtos/slack-short-cut.dto';

@Injectable()
export class SlackService {
  private slack: WebClient;
  private readonly USER_ACTION_ID = 'selected_users';
  private readonly TAG_ACTION_ID = 'selected_options';
  private readonly LINK_ACTION_ID = 'link';
  private readonly CONTENT_ACTION_ID = 'contents';

  private modalView: ModalView = {
    type: 'modal',
    title: {
      type: 'plain_text',
      text: 'Zettel',
      emoji: true,
    },
    submit: {
      type: 'plain_text',
      text: '제출',
      emoji: true,
    },
    close: {
      type: 'plain_text',
      text: '닫기',
    },
    callback_id: 'call_modal',
    blocks: [
      {
        type: 'input',
        element: {
          type: 'multi_users_select',
          placeholder: {
            type: 'plain_text',
            text: 'Select companions',
            emoji: true,
          },
          action_id: this.USER_ACTION_ID,
        },
        label: {
          type: 'plain_text',
          text: '동료',
          emoji: true,
        },
      },
      {
        type: 'input',
        element: {
          type: 'multi_static_select',
          placeholder: {
            type: 'plain_text',
            text: 'Select options',
            emoji: true,
          },
          options: [
            {
              text: {
                type: 'plain_text',
                text: '태그1',
                emoji: true,
              },
              value: 'value-0',
            },
            {
              text: {
                type: 'plain_text',
                text: '태그2',
                emoji: true,
              },
              value: 'value-1',
            },
            {
              text: {
                type: 'plain_text',
                text: '태그3',
                emoji: true,
              },
              value: 'value-2',
            },
          ],
          action_id: this.TAG_ACTION_ID,
        },
        label: {
          type: 'plain_text',
          text: 'Label',
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
          action_id: this.LINK_ACTION_ID,
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
          action_id: this.CONTENT_ACTION_ID,
        },
        label: {
          type: 'plain_text',
          text: '내용',
          emoji: true,
        },
      },
    ],
  };

  constructor(@Inject(slackConfig.KEY) private config: ConfigType<typeof slackConfig>) {
    this.slack = new WebClient();
  }

  async accessWorkspace(code: string) {
    const result = await this.slack.oauth.v2.access({
      code,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
    });
    const userList = await this.slack.users.list({ token: result.access_token });
    console.log(userList);
  }

  async callModal(trigger_id: string) {
    const result = await this.slack.views.open({
      trigger_id,
      view: this.modalView,
    });

    return result ? true : false;
  }

  async getModalValues(payload: InteractionPayload) {
    const blocks = Object.values(payload.view.state.values);

    const values = new Map();
    for (let i = 0; i < blocks.length; i++) {
      const [[key, value]] = Object.entries(blocks[i]);
      values.set(key, value);
    }

    const { user } = payload;
    const receiveUsers = values.get(this.USER_ACTION_ID)[this.USER_ACTION_ID];
    const tags = values
      .get(this.TAG_ACTION_ID)
      [this.TAG_ACTION_ID].map((tag) => `#${tag.text.text}`);
    const link = values.get(this.LINK_ACTION_ID).value;
    const content = values.get(this.CONTENT_ACTION_ID).value;

    const data = { user, receiveUsers, tags, link, content };
    const receiverMentions = receiveUsers.map((user) => `<@${user}>`).join(' ');

    const conversations = await this.slack.conversations.list({
      types: 'public_channel,private_channel',
    });
    const channels = conversations.channels.filter((channel) => channel.is_member);

    if (!channels.length) {
      throw new HttpException('no channels', 400);
    }

    const messageBlocks: (Block | KnownBlock)[] = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${receiverMentions}님! 이거 같이 볼까요?*`,
        },
      },
      {
        type: 'divider',
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `<@${user.id}>님이 공유했어요`,
        },
      },
    ];

    const messageAttachments: MessageAttachment[] = [
      {
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `${tags.join(' ')}`,
            },
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `${content} \n<${link}|읽어보기>`,
            },
          },
        ],
      },
    ];

    await this.slack.chat.postMessage({
      channel: channels[0].id,
      text: 'test',
      blocks: messageBlocks,
      attachments: messageAttachments,
    });

    return data ? true : false;
  }
}

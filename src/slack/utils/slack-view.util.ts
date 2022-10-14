import { TagEntity } from '../../database/entities/tags.entity';
import type {
  ModalView,
  Block,
  KnownBlock,
  MessageAttachment,
  PlainTextOption,
} from '@slack/web-api';

export const USER_ACTION_ID = 'selected_users';
export const TAG_ACTION_ID = 'selected_options';
export const LINK_ACTION_ID = 'link';
export const CONTENT_ACTION_ID = 'contents';

export function slackModalView(tags: TagEntity[]): ModalView {
  const tagOptions: PlainTextOption[] = tags.map((tag) => ({
    text: {
      type: 'plain_text',
      text: tag.name,
      emoji: true,
    },
    value: tag.id,
  }));

  return {
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
          action_id: USER_ACTION_ID,
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
          options: tagOptions,
          action_id: TAG_ACTION_ID,
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
          action_id: LINK_ACTION_ID,
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
          action_id: CONTENT_ACTION_ID,
        },
        label: {
          type: 'plain_text',
          text: '내용',
          emoji: true,
        },
      },
    ],
  };
}

export function slackMessageBlock(
  receiverMentions: string,
  userId: string,
  tags: string,
  content: string,
  link: string,
) {
  const messageBlocks: (Block | KnownBlock)[] = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${receiverMentions}님! 이거 같이 볼까요? 👀*`,
      },
    },
    {
      type: 'divider',
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `<@${userId}>님이 공유했어요`,
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
            text: `${tags}`,
          },
        },
      ],
      color: '#355FE9',
    },
    {
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `${content} \n\n*<${link}|👉 지금 읽어보기>*`,
          },
        },
      ],
      color: '#01319F',
    },
  ];
  return { messageBlocks, messageAttachments };
}

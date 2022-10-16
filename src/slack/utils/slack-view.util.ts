import { TagEntity } from '../../database/entities/tags.entity';
import { LinkEntity } from '../../database/entities/links.entity';
import type {
  ModalView,
  Block,
  KnownBlock,
  MessageAttachment,
  PlainTextOption,
} from '@slack/web-api';
import { DateTime } from 'luxon';

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
      text: '제텔로 공유하기',
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
            text: '함께 볼 사람 선택',
            emoji: true,
          },
          action_id: USER_ACTION_ID,
        },
        label: {
          type: 'plain_text',
          text: '누구와 정보를 공유 할까요?',
          emoji: true,
        },
      },
      {
        type: 'input',
        element: {
          type: 'multi_static_select',
          placeholder: {
            type: 'plain_text',
            text: '태그로 정보를 분류해요',
            emoji: true,
          },
          options: tagOptions,
          action_id: TAG_ACTION_ID,
        },
        label: {
          type: 'plain_text',
          text: '태그 선택',
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
          placeholder: {
            type: 'plain_text',
            text: '링크 붙여넣기',
            emoji: true,
          },
        },
        label: {
          type: 'plain_text',
          text: '공유할 링크 주소를 입력해 주세요',
          emoji: true,
        },
      },
      {
        type: 'input',
        element: {
          type: 'plain_text_input',
          multiline: true,
          action_id: CONTENT_ACTION_ID,
          placeholder: {
            type: 'plain_text',
            text: '공유하고 싶은 이유를 알려주면 함께 볼 사람들의 관심도가 올라가요',
            emoji: true,
          },
        },
        label: {
          type: 'plain_text',
          text: '공유하고 싶은 이유는 무엇인가요?',
          emoji: true,
        },
      },
    ],
  };
}

export function slackModalMessage(
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

export function slackSharingLinkMessage(links: LinkEntity[]) {
  const messageBlocks: (Block | KnownBlock)[] = links.map((link) => {
    const createdAt = DateTime.fromJSDate(link.createdAt).toFormat('yy년 MM월 dd일');
    const sharedUsers = link.sharedUsers.map((user) => `<@${user.slackUserId}>`).join(' ');
    const content = link.content.slice(0, 80);
    return slackLinkMessage(createdAt, `${sharedUsers}님에게 공유했어요`, content, link.url);
  });
  return slackLinkBlocks(messageBlocks, '공유한 링크가 없습니다');
}

export function slackSharedLinkMessage(links: LinkEntity[]) {
  const messageBlocks: (Block | KnownBlock)[] = links.map((link) => {
    const createdAt = DateTime.fromJSDate(link.createdAt).toFormat('yy년 MM월 dd일');
    const sharingUser = `<@${link.sharingUser.slackUserId}>님이 공유했어요`;
    const content = link.content.slice(0, 80);
    return slackLinkMessage(createdAt, sharingUser, content, link.url);
  });
  return slackLinkBlocks(messageBlocks, '공유받은 링크가 없습니다');
}

function slackLinkMessage(createdAt: string, userMessage: string, content: string, url: string) {
  return {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `${createdAt}에 ${userMessage}\n${content}${
        content.length === 80 ? '...' : ''
      }\n*<${url}|👉 지금 읽어보기>*\n\n`,
    },
  };
}

function slackLinkBlocks(messageBlocks: (Block | KnownBlock)[], emptyMessage: string) {
  return {
    blocks: messageBlocks.length
      ? messageBlocks
      : [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `${emptyMessage}\n\n`,
            },
          },
        ],
  };
}

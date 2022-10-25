import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { WebClient } from '@slack/web-api';
import slackConfig from 'src/config/slack.config';
import {
  SlackUserEntity,
  SlackTeamEntity,
  TeamEntity,
  UserEntity,
  LinkEntity,
} from 'src/database/entities';
import type { BlockActionPayload, InteractionPayload, SlackModalData } from './interfaces';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import {
  CONTENT_ACTION_ID,
  LINK_ACTION_ID,
  slackSharingLinkMessage,
  slackModalMessage,
  slackModalView,
  slackSharedLinkMessage,
  TAG_ACTION_ID,
  USER_ACTION_ID,
} from './utils';
import type { Enterprise } from '@slack/web-api/dist/response/OauthV2AccessResponse';
import { TagEntity } from '../database/entities/tags.entity';
import { slackUpdatedModalView, USER_OPTION_ACTION_ID } from './utils/slack-view.util';

@Injectable()
export class SlackService {
  private slack: WebClient;
  private defaultTags = [
    '트렌드',
    '서비스',
    '비즈니스',
    '기획',
    '디자인',
    '데이터',
    '개발',
    '마케팅',
    '커리어',
    '브랜드',
  ];

  constructor(
    @Inject(slackConfig.KEY) private config: ConfigType<typeof slackConfig>,
    @InjectRepository(SlackTeamEntity) private slackTeamRepository: Repository<SlackTeamEntity>,
    @InjectRepository(SlackUserEntity) private slackUserRepository: Repository<SlackUserEntity>,
    @InjectRepository(TeamEntity) private teamRepository: Repository<TeamEntity>,
    @InjectRepository(UserEntity) private userRepository: Repository<UserEntity>,
    @InjectRepository(TagEntity) private tagRepository: Repository<TagEntity>,
    @InjectRepository(LinkEntity) private linkRepository: Repository<LinkEntity>,
  ) {
    this.slack = new WebClient();
  }

  async accessWorkspace(code: string) {
    const result = await this.slack.oauth.v2.access({
      code,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
    });
    const { id, name } = result.team;
    const enterpriseData = result.enterprise;

    const teamData = await this.saveTeam(id, name, result.access_token, enterpriseData);
    if (teamData) {
      const { slackTeam, team } = teamData;
      await this.saveUsers(slackTeam, team);
    }

    return `<script type="text/javascript">location.href = "slack://open?team=${id}";</script>`;
  }

  private async saveTeam(
    id: string,
    name: string,
    accessToken: string,
    enterpriseData?: Enterprise,
  ): Promise<{ slackTeam: SlackTeamEntity; team: TeamEntity } | undefined> {
    const exSlackTeam = await this.slackTeamRepository.findOneBy({ id });
    if (exSlackTeam) {
      return;
    }

    const slackTeamEntity = this.slackTeamRepository.create({
      id,
      name,
      accessToken,
      enterpriseId: enterpriseData?.id,
      enterpriseName: enterpriseData?.name,
    });
    const slackTeam = await this.slackTeamRepository.save(slackTeamEntity);

    const tags = this.defaultTags.map((tag) => {
      const tagEntity = this.tagRepository.create({
        name: tag,
      });
      return tagEntity;
    });
    const teamEntity = this.teamRepository.create({
      slackTeam,
      tags,
    });
    const team = await this.teamRepository.save(teamEntity);

    return { slackTeam, team };
  }

  private async saveUsers(slackTeam: SlackTeamEntity, team: TeamEntity) {
    let userData = await this.slack.users.list({ token: slackTeam.accessToken });
    let validMembers = userData.members.filter(
      (member) => !member.is_bot && !member.deleted && member.is_email_confirmed,
    );
    while (userData.response_metadata.next_cursor.length) {
      userData = await this.slack.conversations.list({
        token: slackTeam.accessToken,
        cursor: userData.response_metadata.next_cursor,
      });
      const newValidMembers = userData.members.filter(
        (member) => !member.is_bot && !member.deleted && member.is_email_confirmed,
      );
      validMembers = [...validMembers, ...newValidMembers];
    }

    const slackUserEntities = validMembers.map((member) => {
      const { id, name, real_name, profile } = member;
      const slackUser = this.slackUserRepository.create({
        id,
        email: profile.email,
        name,
        realName: real_name,
        slackTeam,
      });
      return slackUser;
    });
    const slackUsers = await Promise.all(
      slackUserEntities.map((slackUser) => this.slackUserRepository.save(slackUser)),
    );

    const userEntities = slackUsers.map((slackUser) => {
      const user = this.userRepository.create({
        team,
        slackUser,
      });
      return user;
    });
    await Promise.all(userEntities.map((user) => this.userRepository.save(user)));
  }

  async callModal(slackTeamId: string, trigger_id: string) {
    const team = await this.teamRepository.findOne({
      relations: { slackTeam: true, tags: true },
      where: {
        slackTeam: {
          id: slackTeamId,
        },
      },
    });
    await this.slack.views.open({
      token: team.slackTeam.accessToken,
      trigger_id,
      view: slackModalView(team.tags),
    });
  }

  async updateModal(payload: BlockActionPayload) {
    const team = await this.teamRepository.findOne({
      relations: { slackTeam: true, tags: true },
      where: {
        slackTeam: {
          id: payload.team.id,
        },
      },
    });

    await this.slack.views.update({
      token: team.slackTeam.accessToken,
      view: slackUpdatedModalView(
        payload.view,
        payload.actions[0].selected_option.value === 'selected_all',
      ),
      view_id: payload.view.id,
    });
  }

  async sendLink(payload: InteractionPayload) {
    const slackModalData = await this.getModalData(payload);

    const linkId = await this.saveLink(payload.user.id, slackModalData);

    await this.postSlackMessage(payload.team.id, payload.user.id, linkId, slackModalData);
  }

  async getModalData(payload: InteractionPayload): Promise<SlackModalData> {
    const blocks = Object.values(payload.view.state.values);

    const values = new Map();
    for (let i = 0; i < blocks.length; i++) {
      const [[key, value]] = Object.entries(blocks[i]);
      values.set(key, value);
    }

    const userOption = values.get(USER_OPTION_ACTION_ID).selected_option.value;
    let receiveUsers;
    if (userOption === 'selected_users') {
      receiveUsers = values.get(USER_ACTION_ID)[USER_ACTION_ID];
    }
    const tags = values.get(TAG_ACTION_ID)[TAG_ACTION_ID];
    const link = values.get(LINK_ACTION_ID).value;
    const content = values.get(CONTENT_ACTION_ID).value;

    return {
      userOption,
      receiveUsers,
      tagIds: tags.map((tag) => tag.value),
      url: link,
      content,
      tagMessage: tags.map((tag) => `#${tag.text.text}`).join(' '),
    };
  }

  async saveLink(userId: string, slackModalData: SlackModalData): Promise<string> {
    const sharingUser = await this.userRepository.findOneBy({
      slackUser: {
        id: userId,
      },
    });

    const { receiveUsers, tagIds, url, content } = slackModalData;

    let sharedUsers;
    if (receiveUsers) {
      sharedUsers = await Promise.all(
        receiveUsers.map((userId) =>
          this.userRepository.findOneBy({
            slackUser: {
              id: userId,
            },
          }),
        ),
      );
    } else {
      const team = await this.teamRepository.findOne({
        relations: { users: true },
        where: {
          id: sharingUser.teamId,
        },
      });
      sharedUsers = team.users;
    }

    if (!sharedUsers.length) {
      throw new BadRequestException('no users');
    }
    const tags = await Promise.all(
      tagIds.map((tagId) => this.tagRepository.findOneBy({ id: tagId })),
    );

    const linkEntity = this.linkRepository.create({
      url,
      content,
      sharingUser,
      sharedUsers,
      tags,
    });
    const link = await this.linkRepository.save(linkEntity);

    return link.id;
  }

  async postSlackMessage(
    teamId: string,
    userId: string,
    linkId: string,
    slackModalData: SlackModalData,
  ) {
    const { userOption, receiveUsers, tagMessage, content, url } = slackModalData;

    const slackTeam = await this.slackTeamRepository.findOneBy({ id: teamId });

    let conversations = await this.slack.conversations.list({
      token: slackTeam.accessToken,
      types: 'public_channel,private_channel',
    });
    let channels = conversations.channels.filter((channel) => channel.is_member);

    while (conversations.response_metadata.next_cursor.length && !channels.length) {
      conversations = await this.slack.conversations.list({
        token: slackTeam.accessToken,
        types: 'public_channel,private_channel',
        cursor: conversations.response_metadata.next_cursor,
      });
      channels = conversations.channels.filter((channel) => channel.is_member);
    }

    if (!channels.length) {
      throw new BadRequestException('no channels');
    }

    const receiverMentions =
      userOption === 'selected_all'
        ? '<!here|here>'
        : `${receiveUsers.map((user) => `<@${user}>`).join(' ')}님!`;

    const { messageBlocks, messageAttachments } = slackModalMessage(
      linkId,
      receiverMentions,
      userId,
      tagMessage,
      content,
      url,
    );

    await this.slack.chat.postMessage({
      token: slackTeam.accessToken,
      channel: channels[0].id,
      text: content,
      blocks: messageBlocks,
      attachments: messageAttachments,
    });
  }

  async getSharingLinks(slackUserId: string) {
    const user = await this.userRepository.findOneBy({ slackUserId });
    const links = await this.linkRepository.find({
      relations: { sharedUsers: true },
      where: { sharingUser: { id: user.id } },
      order: { createdAt: 'ASC' },
    });
    const userCount = await this.userRepository.count({
      relations: { team: true },
      where: { team: { id: user.teamId } },
    });

    return slackSharingLinkMessage(links, userCount);
  }

  async getSharedLinks(slackUserId: string) {
    const user = await this.userRepository.findOneBy({ slackUserId });
    const links = await this.linkRepository.find({
      relations: { sharingUser: true },
      where: { sharedUsers: { id: user.id } },
      order: { createdAt: 'ASC' },
    });

    return slackSharedLinkMessage(links);
  }
}

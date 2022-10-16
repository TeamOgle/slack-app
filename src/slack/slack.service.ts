import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { type UsersListResponse, WebClient } from '@slack/web-api';
import slackConfig from 'src/config/slack.config';
import {
  SlackUserEntity,
  SlackTeamEntity,
  TeamEntity,
  UserEntity,
  LinkEntity,
} from 'src/database/entities';
import type { InteractionPayload } from './interfaces';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ulid } from 'ulid';
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
    // @Inject() private slackViewService: SlackViewService,
    @InjectRepository(SlackTeamEntity) private slackTeamRepository: Repository<SlackTeamEntity>,
    @InjectRepository(SlackUserEntity) private slackUserRepository: Repository<SlackUserEntity>,
    @InjectRepository(TeamEntity) private teamRepository: Repository<TeamEntity>,
    @InjectRepository(UserEntity) private userRepository: Repository<UserEntity>,
    @InjectRepository(TagEntity) private tagRepository: Repository<TagEntity>,
    @InjectRepository(LinkEntity) private linkRepository: Repository<LinkEntity>,
  ) {
    this.slack = new WebClient();
  }

  async accessWorkspace(code: string): Promise<void> {
    const result = await this.slack.oauth.v2.access({
      code,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
    });
    const userData = await this.slack.users.list({ token: result.access_token });
    const { id, name } = result.team;
    const enterpriseData = result.enterprise;

    const { slackTeam, team } = await this.saveTeam(id, name, result.access_token, enterpriseData);
    await this.saveUsers(userData, slackTeam, team);
  }

  private async saveTeam(
    id: string,
    name: string,
    accessToken: string,
    enterpriseData?: Enterprise,
  ): Promise<{ slackTeam: SlackTeamEntity; team: TeamEntity }> {
    const exSlackTeam = await this.slackTeamRepository.findOneBy({ id });
    if (exSlackTeam) {
      throw new BadRequestException('exist team');
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
        id: ulid(),
        name: tag,
      });
      return tagEntity;
    });
    const teamEntity = this.teamRepository.create({
      id: ulid(),
      slackTeam,
      tags,
    });
    const team = await this.teamRepository.save(teamEntity);

    return { slackTeam, team };
  }

  private async saveUsers(
    userData: UsersListResponse,
    slackTeam: SlackTeamEntity,
    team: TeamEntity,
  ) {
    const validMembers = userData.members.filter(
      (member) => !member.is_bot && !member.deleted && member.is_email_confirmed,
    );
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
        id: ulid(),
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

  async sendLink(payload: InteractionPayload) {
    const { receiveUsers, tagIds, url, content } = await this.postSlackMessage(payload);

    const sharingUser = await this.userRepository.findOneBy({
      slackUser: {
        id: payload.user.id,
      },
    });
    const sharedUsers = await Promise.all(
      receiveUsers.map((userId) =>
        this.userRepository.findOneBy({
          slackUser: {
            id: userId,
          },
        }),
      ),
    );
    const tags = await Promise.all(
      tagIds.map((tagId) => this.tagRepository.findOneBy({ id: tagId })),
    );

    const linkEntity = this.linkRepository.create({
      id: ulid(),
      url,
      content,
      sharingUser,
      sharedUsers,
      tags,
    });
    await this.linkRepository.save(linkEntity);
  }

  async postSlackMessage(payload: InteractionPayload) {
    const slackTeam = await this.slackTeamRepository.findOneBy({ id: payload.team.id });
    const blocks = Object.values(payload.view.state.values);

    const values = new Map();
    for (let i = 0; i < blocks.length; i++) {
      const [[key, value]] = Object.entries(blocks[i]);
      values.set(key, value);
    }

    const { user } = payload;
    const receiveUsers = values.get(USER_ACTION_ID)[USER_ACTION_ID];
    const tags = values.get(TAG_ACTION_ID)[TAG_ACTION_ID];
    const link = values.get(LINK_ACTION_ID).value;
    const content = values.get(CONTENT_ACTION_ID).value;

    const receiverMentions = receiveUsers.map((user) => `<@${user}>`).join(' ');

    const conversations = await this.slack.conversations.list({
      token: slackTeam.accessToken,
      types: 'public_channel,private_channel',
    });
    const channels = conversations.channels.filter((channel) => channel.is_member);

    if (!channels.length) {
      throw new BadRequestException('no channels');
    }

    const { messageBlocks, messageAttachments } = slackModalMessage(
      receiverMentions,
      user.id,
      tags.map((tag) => `#${tag.text.text}`).join(' '),
      content,
      link,
    );

    await this.slack.chat.postMessage({
      token: slackTeam.accessToken,
      channel: channels[0].id,
      text: content,
      blocks: messageBlocks,
      attachments: messageAttachments,
    });

    return { receiveUsers, tagIds: tags.map((tag) => tag.value), url: link, content };
  }

  async getSharingLinks(slackUserId: string) {
    const user = await this.userRepository.findOneBy({ slackUser: { id: slackUserId } });
    const links = await this.linkRepository.find({
      relations: { sharedUsers: true },
      where: { sharingUser: { id: user.id } },
    });

    return slackSharingLinkMessage(links);
  }

  async getSharedLinks(slackUserId: string) {
    const user = await this.userRepository.findOneBy({ slackUser: { id: slackUserId } });
    const links = await this.linkRepository.find({
      relations: { sharingUser: true },
      where: { sharedUsers: { id: user.id } },
    });

    return slackSharedLinkMessage(links);
  }
}

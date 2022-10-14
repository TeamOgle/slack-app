import { HttpException, Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { type UsersListResponse, WebClient } from '@slack/web-api';
import slackConfig from 'src/config/slack.config';
import { SlackUserEntity, SlackTeamEntity, TeamEntity, UserEntity } from 'src/database/entities';
import type { InteractionPayload } from './interfaces';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ulid } from 'ulid';
import {
  CONTENT_ACTION_ID,
  LINK_ACTION_ID,
  slackMessageBlock,
  slackModalView,
  TAG_ACTION_ID,
  USER_ACTION_ID,
} from './utils';
import type { Enterprise } from '@slack/web-api/dist/response/OauthV2AccessResponse';

@Injectable()
export class SlackService {
  private slack: WebClient;

  constructor(
    @Inject(slackConfig.KEY) private config: ConfigType<typeof slackConfig>,
    // @Inject() private slackViewService: SlackViewService,
    @InjectRepository(SlackTeamEntity) private slackTeamRepository: Repository<SlackTeamEntity>,
    @InjectRepository(SlackUserEntity) private slackUserRepository: Repository<SlackUserEntity>,
    @InjectRepository(TeamEntity) private teamRepository: Repository<TeamEntity>,
    @InjectRepository(UserEntity) private userRepository: Repository<UserEntity>,
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
    enterpriseData: Enterprise,
  ): Promise<{ slackTeam: SlackTeamEntity; team: TeamEntity }> {
    const slackTeamEntity = this.slackTeamRepository.create({
      id,
      name,
      accessToken,
      enterpriseId: enterpriseData.id,
      enterpriseName: enterpriseData.name,
    });
    const slackTeam = await this.slackTeamRepository.save(slackTeamEntity);

    const teamEntity = this.teamRepository.create({
      id: ulid(),
      slackTeam,
    });
    const team = await this.teamRepository.save(teamEntity);

    return { slackTeam, team };
  }

  private async saveUsers(
    userData: UsersListResponse,
    slackTeam: SlackTeamEntity,
    team: TeamEntity,
  ) {
    const slackUserEntities = userData.members.map((member) => {
      const { id, name, real_name } = member;
      const slackUser = this.slackUserRepository.create({
        id,
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

  async callModal(trigger_id: string) {
    const result = await this.slack.views.open({
      trigger_id,
      view: slackModalView([]),
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
    const receiveUsers = values.get(USER_ACTION_ID)[USER_ACTION_ID];
    const tags = values.get(TAG_ACTION_ID)[TAG_ACTION_ID].map((tag) => `#${tag.text.text}`);
    const link = values.get(LINK_ACTION_ID).value;
    const content = values.get(CONTENT_ACTION_ID).value;

    const data = { user, receiveUsers, tags, link, content };
    const receiverMentions = receiveUsers.map((user) => `<@${user}>`).join(' ');

    const conversations = await this.slack.conversations.list({
      types: 'public_channel,private_channel',
    });
    const channels = conversations.channels.filter((channel) => channel.is_member);

    if (!channels.length) {
      throw new HttpException('no channels', 400);
    }

    const { messageBlocks, messageAttachments } = slackMessageBlock(
      receiverMentions,
      user.id,
      tags.join(' '),
      content,
      link,
    );

    await this.slack.chat.postMessage({
      channel: channels[0].id,
      text: 'test',
      blocks: messageBlocks,
      attachments: messageAttachments,
    });

    return data ? true : false;
  }
}

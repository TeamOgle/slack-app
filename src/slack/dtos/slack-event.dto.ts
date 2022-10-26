// https://api.slack.com/events/url_verification
export class SlackVerificationEventDto {
  token: string;
  challenge: string;
  type: 'url_verification';
}

export class SlackEventDto {
  type: 'event_callback';
  team_id: string;
  event: {
    type: 'team_join';
    user: {
      id: string;
      profile: { email: string };
      name: string;
      real_name: string;
      deleted: boolean;
      is_bot: boolean;
      is_email_confirmed: boolean;
    };
  };
}

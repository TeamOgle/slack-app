// https://api.slack.com/events/url_verification
export class SlackEventDto {
  token: string;
  challenge: string;
  type: 'url_verification';
}

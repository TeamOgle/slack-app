import { registerAs } from '@nestjs/config';

export default registerAs('slack', () => ({
  userToken: process.env.SLACK_USER_TOKEN,
  botToken: process.env.SLACK_BOT_TOKEN,
}));

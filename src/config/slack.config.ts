import { registerAs } from '@nestjs/config';

export default registerAs('slack', () => ({
  token: process.env.SLACK_TOKEN,
}));

import * as Joi from 'joi';

export const validationSchema = Joi.object({
  SLACK_USER_TOKEN: Joi.string().required(),
  SLACK_BOT_TOKEN: Joi.string().required(),
});

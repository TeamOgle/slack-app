import * as Joi from 'joi';

export const validationSchema = Joi.object({
  SLACK_TOKEN: Joi.string().required(),
});

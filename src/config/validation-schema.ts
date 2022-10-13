import * as Joi from 'joi';

export const validationSchema = Joi.object({
  SLACK_CLIENT_ID: Joi.string().required(),
  SLACK_CLIENT_SECRET: Joi.string().required(),
  ZETTEL_DB_HOST: Joi.string().required(),
  ZETTEL_DB_USER: Joi.string().required(),
  ZETTEL_DB_PASSWORD: Joi.string().required(),
  ZETTEL_DB_NAME: Joi.string().required(),
});

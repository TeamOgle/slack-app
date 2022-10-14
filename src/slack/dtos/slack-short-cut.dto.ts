import type { InteractionPayload, ShortCutPayload } from '../interfaces';

export class SlackShortCutDto {
  payload: ShortCutPayload | InteractionPayload;
}

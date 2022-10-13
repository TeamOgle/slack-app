interface ShortCutPayload {
  type: 'shortcut' | 'message_action';
  trigger_id: string;
}

interface InteractionView {
  id: string;
  type: 'modal';
  state: { values: any };
}

export interface InteractionPayload {
  type: 'view_submission';
  team: any;
  user: any;
  view: InteractionView;
}

export class SlackShortCutDto {
  payload: ShortCutPayload | InteractionPayload;
}

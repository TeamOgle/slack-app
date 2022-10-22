import type { ModalView } from '@slack/web-api';

// https://api.slack.com/reference/interaction-payloads/shortcuts
export interface ShortCutPayload {
  type: 'shortcut' | 'message_action';
  trigger_id: string;
  team: { id: string };
}

export interface InteractionView {
  id: string;
  type: 'modal';
  state: { values: any };
}

// https://api.slack.com/reference/interaction-payloads/views#view_submission
export interface InteractionPayload {
  type: 'view_submission';
  team: { id: string };
  user: { id: string };
  view: InteractionView;
}

export interface BlockActionPayload {
  type: 'block_actions';
  team: { id: string };
  view: ModalView;
}
